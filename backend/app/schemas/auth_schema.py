from pydantic import BaseModel, EmailStr

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # worker | hirer | lender

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class OTPVerifySchema(BaseModel):
    email: EmailStr
    otp: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
