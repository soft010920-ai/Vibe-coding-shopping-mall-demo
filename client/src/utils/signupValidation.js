export function validateSignupForm(formData) {
  const newErrors = {}

  if (!formData.name.trim()) {
    newErrors.name = '이름을 입력해주세요.'
  }

  if (!formData.email.trim()) {
    newErrors.email = '이메일을 입력해주세요.'
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    newErrors.email = '유효한 이메일 주소를 입력해주세요.'
  }

  if (!formData.password) {
    newErrors.password = '비밀번호를 입력해주세요.'
  } else if (formData.password.length < 6) {
    newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
  }

  if (!formData.passwordConfirm) {
    newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
  } else if (formData.password !== formData.passwordConfirm) {
    newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  if (!formData.phone.trim()) {
    newErrors.phone = '전화번호를 입력해주세요.'
  } else if (!/^[0-9-]+$/.test(formData.phone.replace(/\s/g, ''))) {
    newErrors.phone = '유효한 전화번호를 입력해주세요.'
  }

  return newErrors
}

