import { useEffect, useState } from 'react';
import api from '../services/api';

export interface FormQuestionConfig {
  id: string;
  form_type: string;
  question_key: string;
  label: string;
  is_active: boolean;
  is_required: boolean;
  display_order: number;
}

export function useFormQuestions(formType: 'colleague' | 'conditions') {
  const [questions, setQuestions] = useState<FormQuestionConfig[]>([]);

  useEffect(() => {
    api.get('/feedbacks/form-questions', { params: { formType } })
      .then((response) => setQuestions(response.data.questions))
      .catch(() => setQuestions([]));
  }, [formType]);

  function isActive(key: string) {
    const q = questions.find((item) => item.question_key === key);
    return q ? q.is_active : true;
  }

  function getLabel(key: string, fallback: string) {
    const q = questions.find((item) => item.question_key === key);
    return q?.label || fallback;
  }

  return { questions, isActive, getLabel };
}
