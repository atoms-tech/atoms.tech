'use server';

import { saveSession } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';

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
 * Initiate OAuth login with Google
 */
export async function loginWithGoogle() {
    try {
        const workos = getWorkOSClient();
        const clientId = process.env.WORKOS_CLIENT_ID;
        const redirectUri =
            process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
            `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

        if (!clientId) {
            throw new Error('WORKOS_CLIENT_ID is required');
        }

        const authorizationUrl = workos.userManagement.getAuthorizationUrl({
            provider: 'GoogleOAuth',
            redirectUri,
            clientId,
        });

        redirect(authorizationUrl);
    } catch (error) {
        console.error('Google OAuth error:', error);
        throw error;
    }
}

/**
 * Initiate OAuth login with GitHub
 */
export async function loginWithGitHub() {
    try {
        const workos = getWorkOSClient();
        const clientId = process.env.WORKOS_CLIENT_ID;
        const redirectUri =
            process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
            `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

        if (!clientId) {
            throw new Error('WORKOS_CLIENT_ID is required');
        }

        const authorizationUrl = workos.userManagement.getAuthorizationUrl({
            provider: 'GitHubOAuth',
            redirectUri,
            clientId,
        });

        redirect(authorizationUrl);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        throw error;
    }
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

        console.log('Requesting password reset for email:', email);

        // Create password reset token via WorkOS
        const workos = getWorkOSClient();
        let passwordResetData;

        try {
            passwordResetData = await workos.userManagement.createPasswordReset({
                email,
            });
            console.log('WorkOS password reset created:', {
                id: passwordResetData.id,
                email: passwordResetData.email,
            });
        } catch (workosError) {
            console.error('WorkOS password reset creation failed:', {
                error: workosError,
                message:
                    workosError instanceof Error ? workosError.message : 'Unknown error',
                email,
            });

            // If WorkOS email sending is not configured, try fallback with Resend
            const resendApiKey = process.env.RESEND_API_KEY;
            const resendFromEmail = process.env.RESEND_FROM_EMAIL;
            const resetUrl = process.env.WORKOS_PASSWORD_RESET_URL;

            if (resendApiKey && resendFromEmail && resetUrl) {
                console.log('Attempting fallback email sending via Resend');

                try {
                    // Re-create the password reset to get a token
                    passwordResetData = await workos.userManagement.createPasswordReset({
                        email,
                    });

                    const resend = new Resend(resendApiKey);
                    const resetLink = `${resetUrl}?token=${passwordResetData.passwordResetToken}`;

                    const emailResult = await resend.emails.send({
                        from: resendFromEmail,
                        to: email,
                        subject: 'Reset Your Password - Atoms.Tech',
                        html: `
                            <h2>Reset Your Password</h2>
                            <p>You requested to reset your password for your Atoms.Tech account.</p>
                            <p>Click the link below to create a new password:</p>
                            <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all;">${resetLink}</p>
                            <p>This link will expire in 24 hours.</p>
                            <p>If you didn't request a password reset, you can safely ignore this email.</p>
                            <hr />
                            <p style="color: #666; font-size: 12px;">Atoms.Tech Password Reset</p>
                        `,
                    });

                    console.log('Fallback password reset email sent via Resend:', {
                        emailId: emailResult.data?.id,
                        to: email,
                    });

                    return {
                        success: true,
                        message: `Password reset link has been sent to ${email}. Please check your email.`,
                    };
                } catch (fallbackError) {
                    console.error('Fallback email sending failed:', {
                        error: fallbackError,
                        message:
                            fallbackError instanceof Error
                                ? fallbackError.message
                                : 'Unknown error',
                        email,
                    });
                    throw workosError; // Throw the original WorkOS error
                }
            } else {
                console.error('Cannot send fallback email: Missing configuration', {
                    hasResendKey: !!resendApiKey,
                    hasFromEmail: !!resendFromEmail,
                    hasResetUrl: !!resetUrl,
                });
                throw workosError; // Throw the original WorkOS error
            }
        }

        // WorkOS successfully sent the email
        return {
            success: true,
            message: `Password reset link has been sent to ${email}. Please check your email.`,
        };
    } catch (error) {
        const errorString = String(error);
        console.error('Auth action error (password reset):', {
            error,
            errorString,
            message: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            error: 'Failed to send password reset email. Please try again or contact support.',
            success: false,
        };
    }
}
