export interface WizardState {
    currentStep: number
    data: WizardData
    isLoading: boolean
    error: string | null
}

export interface WizardData {
    // Step 1: Credentials (managed by AuthContext/Supabase Auth, but we track completion)
    userId?: string
    email?: string

    // Step 2: Email Verification
    emailVerified: boolean

    // Step 3: Company Info
    companyName: string
    website?: string
    industry: string
    employeeCount: string // Radio selection

    // Step 4: Target Audience
    customerType: 'b2c' | 'b2b' | 'both' | ''
    acquisitionChannels: string[] // Multi-select

    // Step 5: Usage & Goals
    usageGoals: string[] // Multi-select
    dataStorage: string // Radio selection "Hubspot", "Salesforce", etc. (Single)

    // Step 6: Profile
    role: string
    phoneNumber: string
    phoneVerified?: boolean

    // ...
}

export const INITIAL_WIZARD_DATA: WizardData = {
    emailVerified: false,
    companyName: '',
    industry: '',
    employeeCount: '',
    customerType: '',
    acquisitionChannels: [],
    usageGoals: [],
    dataStorage: '',
    role: '',
    phoneNumber: '',
    phoneVerified: false
}
