import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BoxyLogin, type Credentials } from './BoxyLogin';

const authenticate = ({ username, password }: Credentials) => username === 'admin' && password === '1234';

async function setup(onLogin?: () => void) {
  const user = userEvent.setup();
  render(<BoxyLogin authenticate={authenticate} onLogin={onLogin} />);
  await user.click(screen.getByRole('button', { name: 'Begin login' }));
  return user;
}

describe('BoxyLogin', () => {
  it('moves to the username field when login begins', async () => {
    await setup();
    expect(screen.getByLabelText('username or email')).toHaveFocus();
  });

  it('nudges, and stays put, when a field is skipped', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: 'Next: password' }));
    expect(screen.getByLabelText('username or email')).toHaveAttribute(
      'placeholder',
      'enter your username or email to continue',
    );
    expect(screen.getByLabelText('username or email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('password')).not.toHaveFocus();
  });

  it('logs in with valid credentials, advancing with Enter', async () => {
    const onLogin = vi.fn();
    const user = await setup(onLogin);
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    expect(screen.getByLabelText('password')).toHaveFocus();
    await user.type(screen.getByLabelText('password'), '1234{Enter}');
    await user.click(screen.getByRole('checkbox', { name: /remember me/ }));
    expect(screen.getByRole('checkbox', { name: /remember me/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Logged in.');
    expect(onLogin).toHaveBeenCalledWith({ username: 'admin', rememberMe: true });
  });

  it('offers to log out from the logged-in icon', async () => {
    const user = await setup();
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    await user.type(screen.getByLabelText('password'), '1234{Enter}');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Logged in.');
    expect(screen.queryByRole('button', { name: 'log out' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Logged in' }));
    await user.click(screen.getByRole('button', { name: 'log out' }));
    expect(screen.queryByRole('button', { name: 'log out' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Begin login' }));
    expect(screen.getByLabelText('username or email')).toHaveValue('');
    expect(screen.getByLabelText('password')).toHaveValue('');
  });

  it('shows and hides the password on request', async () => {
    const user = await setup();
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('password')).toHaveAttribute('type', 'password');
  });

  it('keeps the user on the password until it is correct', async () => {
    const user = await setup();
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    await user.type(screen.getByLabelText('password'), 'nope{Enter}');
    expect(screen.getByLabelText('password')).toHaveValue('');
    expect(screen.getByLabelText('password')).toHaveFocus();
    expect(screen.getByLabelText('password')).toHaveAttribute('placeholder', 'password is incorrect');
    expect(screen.getByLabelText('password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Password is incorrect.');
    expect(screen.getByRole('checkbox', { name: /remember me/ }).closest('[inert]')).not.toBeNull();

    await user.type(screen.getByLabelText('password'), '1234');
    expect(screen.getByLabelText('password')).toHaveAttribute('aria-invalid', 'false');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('checkbox', { name: /remember me/ }).closest('[inert]')).toBeNull();
  });

  it('says so, and stays put, when the password cannot be checked', async () => {
    const user = userEvent.setup();
    render(
      <BoxyLogin
        authenticate={() => {
          throw new Error('offline');
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Begin login' }));
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    await user.type(screen.getByLabelText('password'), '1234{Enter}');
    expect(screen.getByLabelText('password')).toHaveAttribute(
      'placeholder',
      'password could not be checked, try again',
    );
    expect(screen.getByLabelText('password')).toHaveFocus();
  });

  it('reports a failed login and lets the user try again', async () => {
    const user = userEvent.setup();
    render(
      <BoxyLogin
        authenticate={authenticate}
        onLogin={() => {
          throw new Error('session failed');
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Begin login' }));
    await user.type(screen.getByLabelText('username or email'), 'admin{Enter}');
    await user.type(screen.getByLabelText('password'), '1234{Enter}');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Login failed');
    await user.click(screen.getByRole('button', { name: 'Login failed, try again' }));
    expect(screen.getByLabelText('username or email')).toHaveFocus();
    expect(screen.getByLabelText('password')).toHaveValue('');
  });
});
