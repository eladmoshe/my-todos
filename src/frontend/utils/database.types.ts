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
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id: number
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id?: number
        }
      }
      sections: {
        Row: {
          id: number
          title: string
          order: number
        }
        Insert: {
          id?: number
          title: string
          order?: number
        }
        Update: {
          id?: number
          title?: string
          order?: number
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
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id: number
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          section_id?: number
        }
      }
      sections: {
        Row: {
          id: number
          title: string
          order: number
        }
        Insert: {
          id?: number
          title: string
          order?: number
        }
        Update: {
          id?: number
          title?: string
          order?: number
        }
      }
    }
  }
}
