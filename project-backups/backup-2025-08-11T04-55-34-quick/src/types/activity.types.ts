export interface BSActivity {
  id: string
  trainee_id: string
  activity_date: string
  content: string
  photo_url?: string
  product_id?: number
  activity_type?: string
  is_confirmed: boolean
  instructor_feedback?: string
  created_at: string
  updated_at: string
  trainee?: {
    id: string
    user: {
      name: string
      email: string
    }
  }
  product?: BSProduct
}

export interface BSProduct {
  id: number
  product_name: string
  category?: string
  is_active: boolean
}

export interface BSActivityType {
  id: number
  type_name: string
  description?: string
  is_active: boolean
}

export interface CreateActivityData {
  trainee_id: string
  activity_date: string
  content: string
  photo_url?: string
  product_id?: number
  activity_type?: string
}