import { ApiContractMissingError } from '@/lib/api/errors'
import type { PasswordResetRequestValues, RegistrationValues, SignInResult, SignInValues } from '../types'

// TBD: Backend API missing – authentication contract (sign-in, registration, password reset, sign-out,
// token storage). Decision 0002: no endpoint is guessed; each call fails until the contract is supplied.

export async function signIn(_values: SignInValues): Promise<SignInResult> {
  throw new ApiContractMissingError('Đăng nhập')
}

export async function register(_values: Omit<RegistrationValues, 'confirmPassword'>): Promise<void> {
  throw new ApiContractMissingError('Đăng ký tài khoản')
}

export async function requestPasswordReset(_values: PasswordResetRequestValues): Promise<void> {
  throw new ApiContractMissingError('Yêu cầu đặt lại mật khẩu')
}

export async function signOut(): Promise<void> {
  throw new ApiContractMissingError('Đăng xuất')
}
