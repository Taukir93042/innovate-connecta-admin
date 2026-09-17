import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Account Setting'
      desc='Manage your account security and update your password.'
    >
      <AccountForm />
    </ContentSection>
  )
}
