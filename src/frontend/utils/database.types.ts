export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: number
          text: string
          completed: boolean
          completed_at: string | null
          created_at: string
          section_id: number
          user_id: string
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id: number
          user_id: string
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id?: number
          user_id?: string
        }
      }
      sections: {
        Row: {
          id: number
          title: string
          order: number
          user_id: string
        }
        Insert: {
          id?: number
          title: string
          order?: number
          user_id: string
        }
        Update: {
          id?: number
          title?: string
          order?: number
          user_id?: string
        }
      }
    }
  }
  dev: {
    Tables: {
      todos: {
        Row: {
          id: number
          text: string
          completed: boolean
          completed_at: string | null
          created_at: string
          section_id: number
          user_id: string
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id: number
          user_id: string
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id?: number
          user_id?: string
        }
      }
      sections: {
        Row: {
          id: number
          title: string
          order: number
          user_id: string
        }
        Insert: {
          id?: number
          title: string
          order?: number
          user_id: string
        }
        Update: {
          id?: number
          title?: string
          order?: number
          user_id?: string
        }
      }
    }
  }
}
