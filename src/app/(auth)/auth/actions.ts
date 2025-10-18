'use server';

import { saveSession } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import { redirect } from 'next/navigation';

// Helper function to get WorkOS client
function getWorkOSClient() {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.WORKOS_CLIENT_ID;

    if (!apiKey) {
        throw new Error('WORKOS_API_KEY environment variable is required');
    }

    return new WorkOS(apiKey, {
        clientId,
    });
}

/**
 * Authenticate user with email and password using WorkOS
 */
export async function login(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return {
                error: 'Email and password are required',
                success: false,
            };
        }

        // Use WorkOS User Management API for password authentication
        const response = await fetch(
            'https://api.workos.com/user_management/authenticate',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.WORKOS_API_KEY}`,
                },
                body: JSON.stringify({
                    client_id: process.env.WORKOS_CLIENT_ID,
                    client_secret: process.env.WORKOS_API_KEY,
                    grant_type: 'password',
                    email,
                    password,
                    ip_address: '127.0.0.1',
                    user_agent: 'Custom Login UI',
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('WorkOS authentication error:', errorData);

            if (response.status === 401) {
                return {
                    error: 'Invalid email or password',
                    success: false,
                };
            }

            return {
                error: 'Authentication failed',
                success: false,
            };
        }

        const authData = await response.json();

        // Persist the WorkOS session cookie so withAuth() can access it on subsequent requests.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await saveSession(
            {
                accessToken: authData.access_token,
                refreshToken: authData.refresh_token,
                user: authData.user,
                impersonator: authData.impersonator,
            },
            appUrl,
        );

        return {
            success: true,
            user: authData.user,
        };
    } catch (error) {
        const errorString = String(error);
        console.error('Auth action error:', errorString);

        if (
            errorString.includes('invalid_credentials') ||
            errorString.includes('Invalid')
        ) {
            return {
                error: 'Invalid email or password',
                success: false,
            };
        }

        return {
            error: 'An error occurred. Please try again.',
            success: false,
        };
    }
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, password: string) {
    try {
        if (!token || !password) {
            return {
                error: 'Password reset token and new password are required',
                success: false,
            };
        }

        // Reset the password using WorkOS API
        const workos = getWorkOSClient();
        const _response = await workos.userManagement.resetPassword({
            token,
            newPassword: password,
        });

        return {
            success: true,
            message:
                'Password has been reset successfully. You can now log in with your new password.',
        };
    } catch (error: unknown) {
        const errorString = String(error);
        console.error('Auth action error (password reset completion):', errorString);

        return {
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to reset password. The link may have expired.',
            success: false,
        };
    }
}

/**
 * Accept invitation and create account
 */
export async function acceptInvitation(data: {
    invitationToken: string;
    password: string;
    firstName: string;
    lastName: string;
}) {
    try {
        const { invitationToken, password, firstName, lastName } = data;

        if (!invitationToken || !password || !firstName || !lastName) {
            return {
                error: 'All fields are required',
                success: false,
            };
        }

        // Authenticate with invitation via WorkOS API
        // This creates the user account and authenticates them in one step
        const workos = getWorkOSClient();
        const response = await workos.userManagement.authenticateWithCode({
            clientId: process.env.WORKOS_CLIENT_ID!,
            code: invitationToken,
            codeVerifier: invitationToken, // For invitation flow
        });

        if (!response) {
            return {
                error: 'Failed to accept invitation. The link may have expired.',
                success: false,
            };
        }

        // Update user profile with name
        try {
            const workos = getWorkOSClient();
            await workos.userManagement.updateUser({
                userId: response.user.id,
                firstName,
                lastName,
            });
        } catch (updateError) {
            console.error('Failed to update user profile:', updateError);
            // Continue even if profile update fails
        }

        // Set password for the new user
        try {
            const workos = getWorkOSClient();
            await workos.userManagement.updateUser({
                userId: response.user.id,
                password,
            });
        } catch (passwordError) {
            console.error('Failed to set password:', passwordError);
            // Continue - user can reset password later
        }

        // Save the session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await saveSession(
            {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                user: response.user,
            },
            appUrl,
        );

        // Redirect to home page
        redirect('/home/user');
    } catch (error: unknown) {
        const errorString = String(error);
        console.error('Auth action error (accept invitation):', errorString);

        return {
            error:
                error instanceof Error
                    ? error.message
                    : 'Failed to accept invitation. The link may have expired.',
            success: false,
        };
    }
}

/**
 * Request password reset via email
 */
export async function requestPasswordReset(email: string) {
    try {
        if (!email) {
            return {
                error: 'Email is required',
                success: false,
            };
        }

        // Create password reset token (this automatically sends an email)
        const workos = getWorkOSClient();
        const _passwordReset = await workos.userManagement.createPasswordReset({
            email,
        });

        // The createPasswordReset method automatically sends an email
        // If we need to customize the URL, we can use the passwordResetUrl from the response
        return {
            success: true,
            message: `Password reset link has been sent to ${email}. Please check your email.`,
        };
    } catch (error) {
        const errorString = String(error);
        console.error('Auth action error (password reset):', errorString);

        return {
            error: 'Failed to create password reset. Please try again.',
            success: false,
        };
    }
}
