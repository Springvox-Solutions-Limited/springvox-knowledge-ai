import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  RelatedLinks,
  Steps,
  Step,
} from '@/src/components/docs/DocsPrimitives';

export function UsersAndRolesContent() {
  return (
    <>
      <GuideSection id="roles" title="The three roles">
        <DocsTable
          minWidth={640}
          head={['Role', 'Can do', 'Assigned by']}
          rows={[
            [
              'Viewer',
              'Ask questions, read answers and sources, review their own notifications, and keep private chat history.',
              'Workspace admin, during an invitation or a role change.',
            ],
            [
              'Workspace admin',
              'Everything a viewer can do, plus upload and delete documents, manage collections, invite users, change roles, review analytics and evaluations, and edit workspace settings.',
              'Another workspace admin. The first admin is created with the workspace.',
            ],
            [
              'Platform admin',
              'Operate workspaces, plans, lifecycle, and platform diagnostics across tenants. This is an operator role, not a workspace role.',
              'The platform owner only. Workspace admins cannot grant it.',
            ],
          ]}
        />
        <p>
          A workspace admin can change a viewer to a workspace admin and back.
          They cannot promote anyone to platform admin, and they cannot modify a
          platform admin’s role or status.
        </p>
      </GuideSection>

      <GuideSection id="invite-a-teammate" title="Invite a teammate">
        <Steps>
          <Step title="Open Users">
            Go to <DocLink href="/dashboard/users">Users</DocLink> and select{' '}
            <span className="font-medium text-[var(--ink)]">Invite user</span>.
          </Step>
          <Step title="Enter the work email">
            Use the address the person can actually sign in with. The invitation
            is tied to this address and cannot be accepted with another one.
          </Step>
          <Step title="Choose the role">
            Viewer is the safer default for people who only ask questions.
            Workspace admin is for people who will manage the library, people, or
            settings.
          </Step>
          <Step title="Create the invitation">
            Rekall-IQ creates the invitation and emails it when email delivery is
            configured. The dialog also shows a link you can copy and send
            through your own channel.
          </Step>
        </Steps>
        <Callout tone="tip" title="Send the link through a trusted channel">
          If email is delayed, copy the invitation link from the Users screen and
          send it directly. Treat the link as access to the workspace: anyone who
          signs in with the invited address can accept it.
        </Callout>
      </GuideSection>

      <GuideSection id="accept-an-invite" title="Accept an invitation">
        <Steps>
          <Step title="Open the invitation link">
            The link opens the invitation page with the workspace name, invited
            email, role, and expiry.
          </Step>
          <Step title="Sign in with the invited email">
            Existing users can sign in. New users can create an account from the
            invitation page. The email on the account must match the invitation.
          </Step>
          <Step title="Accept">
            Select <span className="font-medium text-[var(--ink)]">Accept invitation</span>.
            The account is added to the workspace with the invited role and is
            sent to the right start screen.
          </Step>
        </Steps>
        <p>
          If the account is signed in with a different email, acceptance is
          refused with a clear message. Sign out and sign in with the invited
          address.
        </p>
      </GuideSection>

      <GuideSection id="manage-invitations" title="Manage invitations">
        <p>
          The Users screen lists pending invitations with the email, role, and
          expiry date. From there an admin can:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>Copy the invitation link again.</li>
          <li>Revoke an invitation so the link can no longer be accepted.</li>
          <li>See how many invitations are still pending.</li>
        </ul>
        <p>
          Invitations expire seven days after they are created. An expired invite
          cannot be accepted; create a new one. Revoking an invitation does not
          suspend a user who already accepted it.
        </p>
      </GuideSection>

      <GuideSection id="change-a-role" title="Change a role">
        <Steps>
          <Step title="Open the user">
            In <DocLink href="/dashboard/users">Users</DocLink>, select the user,
            then open the detail view.
          </Step>
          <Step title="Choose the new role">
            Select Viewer or Workspace admin under Change role. The change is
            applied to that account.
          </Step>
          <Step title="Confirm a self-demotion">
            Changing your own role away from workspace admin asks for
            confirmation, because you will lose access to the Users screen.
          </Step>
        </Steps>
        <Callout tone="note" title="Role changes are immediate on the server">
          A changed role applies to the account’s next request. If someone is
          already signed in and a screen still looks stale, ask them to refresh
          or sign in again.
        </Callout>
      </GuideSection>

      <GuideSection id="suspend-or-reactivate" title="Suspend or reactivate">
        <p>
          Suspending an account blocks access to app pages without deleting the
          account or its history. Reactivating restores access. Use the row action
          or the user detail view.
        </p>
        <CheckList
          items={[
            'The last active workspace admin cannot suspend their own account.',
            'Platform admins cannot be suspended by a workspace admin.',
            'Suspension does not remove documents the user uploaded.',
            'A suspended user cannot ask questions or open the workspace until reactivated.',
          ]}
        />
        <p>
          The current beta has no “remove member” action. Suspend is the control
          for disabling access. If you need the account detached from the
          workspace entirely, contact us.
        </p>
      </GuideSection>

      <GuideSection id="admin-boundaries" title="Administrative boundaries">
        <p>
          Every people action is scoped to one workspace. A workspace admin
          cannot list or modify users in another workspace, and cannot grant
          platform administration. Role and status changes are written to the
          audit log.
        </p>
        <p>
          Workspace suspension and lifecycle are operator actions. If the
          workspace itself is suspended, expired, or past due, admins may be
          blocked from write actions until the operator resolves the state. The
          app shows the reason on the blocked screen.
        </p>
      </GuideSection>

      <GuideSection id="troubleshooting" title="Troubleshooting">
        <DocsTable
          minWidth={620}
          head={['Problem', 'What to do']}
          rows={[
            [
              'The invitation email never arrived.',
              'Check spam, then copy the link from the pending invitation and send it directly. Email delivery depends on the configured mail provider.',
            ],
            [
              'The invitation says it expired.',
              'Invitations last seven days. Create a new invitation for the same address.',
            ],
            [
              '“You must sign in with the invited email address.”',
              'The browser is signed in as another account. Sign out, then sign in with the invited address.',
            ],
            [
              'A viewer cannot see Upload or Users.',
              'That is the viewer role working as intended. Promote them to workspace admin if they need management access.',
            ],
            [
              'The last admin cannot be suspended.',
              'Promote another active admin first, then suspend the original account.',
            ],
            [
              'A user forgot their password.',
              'A signed-in user can change their password from the account page. Self-serve recovery for a locked-out account is not available in this beta; contact us and we will help. Re-inviting does not reset an existing password.',
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'What workspace admins manage in the library.',
            },
            {
              href: '/docs/admin/analytics-and-evaluations',
              title: 'Analytics, gaps, and evaluations',
              description: 'Measure adoption and answer quality.',
            },
            {
              href: '/docs/security/data-handling',
              title: 'Security and data handling',
              description: 'The boundary between workspace and platform roles.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
