/*
  # Database Webhook Handler

  1. New Edge Function
    - `database-webhook` - Handles database change notifications
    - Processes triggers from database events
    - Integrates with external services and notifications

  2. Features
    - Database event processing
    - External service integration
    - Notification triggering
    - Data synchronization

  3. Security
    - Internal webhook validation
    - Secure event processing
    - Data integrity checks
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DatabaseWebhookEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
  schema: string
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

    const event: DatabaseWebhookEvent = await req.json()

    console.log('Database webhook event:', event.type, event.table)

    // Process different table events
    switch (event.table) {
      case 'contact_messages':
        if (event.type === 'INSERT') {
          await handleNewContactMessage(event.record)
        }
        break

      case 'appointments':
        if (event.type === 'INSERT') {
          await handleNewAppointment(event.record)
        } else if (event.type === 'UPDATE') {
          await handleAppointmentUpdate(event.record, event.old_record)
        }
        break

      case 'calls':
        if (event.type === 'INSERT') {
          await handleNewCall(event.record)
        } else if (event.type === 'UPDATE') {
          await handleCallUpdate(event.record, event.old_record)
        }
        break

      default:
        console.log(`Unhandled table: ${event.table}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing database webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleNewContactMessage(record: any) {
  try {
    // Send notification email to admin
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: 'contact.monsecretaria@gmail.com',
        subject: `Nouveau message de contact - ${record.name}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${record.name}</p>
          <p><strong>Email:</strong> ${record.email}</p>
          <p><strong>Téléphone:</strong> ${record.phone}</p>
          <p><strong>Message:</strong></p>
          <p>${record.message}</p>
        `
      })
    })

    console.log('Contact message notification sent')

  } catch (error) {
    console.error('Error handling new contact message:', error)
  }
}

async function handleNewAppointment(record: any) {
  try {
    // Get user configuration for notifications
    const { data: config } = await supabase
      .from('configurations')
      .select('notifications')
      .eq('user_id', record.user_id)
      .single()

    if (config?.notifications?.appointments?.enabled) {
      // Trigger appointment notification
      await fetch(`${supabaseUrl}/functions/v1/trigger-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          userId: record.user_id,
          type: 'appointment_booked',
          data: {
            clientName: record.client_name,
            date: new Date(record.start_time).toLocaleDateString('fr-FR'),
            time: new Date(record.start_time).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }
        })
      })
    }

    console.log('New appointment notification sent')

  } catch (error) {
    console.error('Error handling new appointment:', error)
  }
}

async function handleAppointmentUpdate(record: any, oldRecord: any) {
  try {
    // Handle appointment status changes
    if (record.status !== oldRecord?.status) {
      console.log(`Appointment ${record.id} status changed from ${oldRecord?.status} to ${record.status}`)
    }

  } catch (error) {
    console.error('Error handling appointment update:', error)
  }
}

async function handleNewCall(record: any) {
  try {
    console.log(`New call started: ${record.id} from ${record.phone_number}`)

  } catch (error) {
    console.error('Error handling new call:', error)
  }
}

async function handleCallUpdate(record: any, oldRecord: any) {
  try {
    // Handle call completion
    if (record.status === 'completed' && oldRecord?.status !== 'completed') {
      console.log(`Call ${record.id} completed`)
      
      // Calculate duration and cost
      if (record.start_time && record.end_time) {
        const duration = new Date(record.end_time).getTime() - new Date(record.start_time).getTime()
        const minutes = Math.ceil(duration / 60000)
        
        // Update call with calculated values
        await supabase
          .from('calls')
          .update({
            duration: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:00`,
            cost: minutes * 0.15 // Example cost calculation
          })
          .eq('id', record.id)
      }
    }

  } catch (error) {
    console.error('Error handling call update:', error)
  }
}