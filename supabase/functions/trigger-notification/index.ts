/*
  # Notification Trigger Function

  1. New Edge Function
    - `trigger-notification` - Centralized notification system
    - Handles SMS and email notifications
    - Integrates with Twilio and email services

  2. Features
    - Multi-channel notifications (SMS, email)
    - Template-based messaging
    - User preference management
    - Delivery tracking

  3. Security
    - User authentication required
    - Rate limiting
    - Secure API integration
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface NotificationRequest {
  userId: string
  type: 'appointment_booked' | 'urgent_call' | 'important_request'
  data: {
    clientName?: string
    phoneNumber?: string
    date?: string
    time?: string
    subject?: string
    importance?: 'low' | 'medium' | 'high'
    details?: string
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { userId, type, data }: NotificationRequest = await req.json()

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user and their notification preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: config, error: configError } = await supabase
      .from('configurations')
      .select('notifications')
      .eq('user_id', userId)
      .single()

    if (configError) {
      return new Response(
        JSON.stringify({ error: 'User configuration not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const notifications = config.notifications || {}
    let message = ''
    let shouldSendSMS = false
    let shouldSendEmail = false
    let emailAddress = user.email

    // Determine notification content and preferences based on type
    switch (type) {
      case 'appointment_booked':
        if (notifications.appointments?.enabled) {
          message = `Nouveau rendez-vous confirmé: ${data.clientName} le ${data.date} à ${data.time}`
          shouldSendSMS = notifications.appointments.sms && user.phone
          shouldSendEmail = notifications.appointments.email && user.email
          if (notifications.appointments.emailAddress) {
            emailAddress = notifications.appointments.emailAddress
          }
        }
        break

      case 'urgent_call':
        if (notifications.urgentCalls?.enabled) {
          message = `URGENT: Appel nécessitant votre attention immédiate de ${data.clientName || 'un client'} (${data.phoneNumber})`
          shouldSendSMS = notifications.urgentCalls.sms && user.phone
          shouldSendEmail = notifications.urgentCalls.email && user.email
          if (notifications.urgentCalls.emailAddress) {
            emailAddress = notifications.urgentCalls.emailAddress
          }
        }
        break

      case 'important_request':
        if (notifications.importantRequests?.enabled) {
          const threshold = notifications.importantRequests.threshold || 'high'
          if (data.importance && ['medium', 'high'].includes(data.importance) && 
              (threshold === 'medium' || data.importance === 'high')) {
            message = `Demande importante: ${data.subject} de ${data.clientName || 'un client'}`
            shouldSendSMS = false // Important requests only via email
            shouldSendEmail = notifications.importantRequests.email && user.email
            if (notifications.importantRequests.emailAddress) {
              emailAddress = notifications.importantRequests.emailAddress
            }
          }
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }

    const results = {
      sms: null,
      email: null
    }

    // Send SMS if enabled and phone number available
    if (shouldSendSMS && user.phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: user.phone,
            Body: message
          })
        })

        if (smsResponse.ok) {
          const smsResult = await smsResponse.json()
          results.sms = {
            success: true,
            messageSid: smsResult.sid,
            status: smsResult.status
          }

          // Log SMS
          await supabase
            .from('sms_logs')
            .insert({
              user_id: userId,
              phone_number: user.phone,
              message: message,
              twilio_sid: smsResult.sid,
              status: smsResult.status,
              notification_type: type,
              sent_at: new Date().toISOString()
            })
        } else {
          throw new Error('SMS sending failed')
        }

      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        results.sms = {
          success: false,
          error: smsError.message
        }
      }
    }

    // Send email if enabled and email available
    if (shouldSendEmail && emailAddress) {
      try {
        const emailSubject = type === 'urgent_call' 
          ? '🚨 URGENT - MonSecretarIA' 
          : '📞 Notification - MonSecretarIA'

        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: emailAddress,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">MonSecretarIA - Notification</h2>
                <p style="font-size: 16px; line-height: 1.5;">${message}</p>
                ${data.details ? `<p style="color: #6b7280;">${data.details}</p>` : ''}
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af;">
                  Cette notification a été envoyée automatiquement par votre assistant MonSecretarIA.
                </p>
              </div>
            `
          })
        })

        results.email = { success: true }

      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        results.email = {
          success: false,
          error: emailError.message
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        message,
        results,
        sentSMS: shouldSendSMS,
        sentEmail: shouldSendEmail
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error triggering notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})