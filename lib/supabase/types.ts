export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Views: {
      learning_courses: {
        Row: {
          id: string
          course_title: string
          level: '입문' | '중급' | '심화'
          duration_hours: number
          competency_area: string
          summary: string
          objectives_json: Json
          target_audience_json: Json
          expected_outcomes_json: Json
          reason_tags_json: Json
          recommended_by: 'skill-gap' | 'role-fit' | 'history-based'
          rank_in_area: number
          status: string
          created_at: string
          preview_url: string | null
          preview_label: string | null
          source_category_1: string | null
          source_category_2: string | null
          content_count: number | null
          instructor: string | null
          has_assessment: boolean | null
          source_duration_text: string | null
        }
      }
      learning_faqs: {
        Row: {
          id: string
          question: string
          answer: string
          status: string
          created_at: string
          updated_at: string
        }
      }
      learning_notices: {
        Row: {
          id: string
          category: string
          date: string
          title: string
          summary: string
          status: string
          created_at: string
          updated_at: string
        }
      }
      learning_questions: {
        Row: {
          id: string
          title: string
          category: string
          type: string
          options_json: Json
          status: string
          created_at: string
        }
      }
      my_profile: {
        Row: {
          id: string
          auth_user_id: string | null
          employee_id: string
          role: 'employee' | 'manager' | 'admin'
          name: string
          organization: string
          division: string
          office: string
          team: string
          company_email: string
          interest_course: string
          created_at: string
        }
      }
    }
    Functions: {
      current_app_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_app_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_journey_stage: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      save_diagnosis: {
        Args: {
          p_diagnosed_at: string
          p_total_score: number
          p_max_score: number
          p_category_scores: Json
          p_top_gaps: Json
        }
        Returns: undefined
      }
      save_selected_course: {
        Args: {
          p_course: Json
        }
        Returns: undefined
      }
      save_enrollment: {
        Args: {
          p_course_id: string
          p_course_title: string
          p_enrollment_requested_at: string
          p_enrollment_status: string
          p_failure_reason?: string | null
        }
        Returns: undefined
      }
    }
  }
}
