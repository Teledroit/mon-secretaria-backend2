export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration: number | null
          phone_number: string
          status: string
          cost: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
          phone_number: string
          status: string
          cost?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
          phone_number?: string
          status?: string
          cost?: number | null
          created_at?: string | null
        }
      }
      transcriptions: {
        Row: {
          id: string
          call_id: string
          timestamp: string
          speaker: string
          content: string
          sentiment: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          call_id: string
          timestamp: string
          speaker: string
          content: string
          sentiment?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          call_id?: string
          timestamp?: string
          speaker?: string
          content?: string
          sentiment?: string | null
          created_at?: string | null
        }
      }
      configurations: {
        Row: {
          id: string
          user_id: string
          tts_engine: string
          nlp_engine: string
          voice_id: string
          temperature: number
          system_instructions: string | null
          welcome_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tts_engine: string
          nlp_engine: string
          voice_id: string
          temperature: number
          system_instructions?: string | null
          welcome_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tts_engine?: string
          nlp_engine?: string
          voice_id?: string
          temperature?: number
          system_instructions?: string | null
          welcome_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}