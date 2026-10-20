import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BoxyLogin, type Credentials } from './BoxyLogin';

const authenticate = ({ username, password }: Credentials) => username === 'admin' && password === '1234';

async function setup() {
  const user = userEvent.setup();
  render(<BoxyLogin authenticate={authenticate} />);
  await user.click(screen.getByRole('button', { name: 'Begin login' }));
  return user;
}

describe('BoxyLogin', () => {
  it('moves to the username field when login begins', async () => {
    await setup();
    expect(screen.getByLabelText('username')).toHaveFocus();
  });

  it('nudges, and stays put, when a field is skipped', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: 'Next: password' }));
    expect(screen.getByLabelText('username')).toHaveAttribute('placeholder', 'enter your username to continue');
    expect(screen.getByLabelText('username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('password')).not.toHaveFocus();
  });

  it('logs in with valid credentials, advancing with Enter', async () => {
    const user = await setup();
    await user.type(screen.getByLabelText('username'), 'admin{Enter}');
    expect(screen.getByLabelText('password')).toHaveFocus();
    await user.type(screen.getByLabelText('password'), '1234{Enter}');
    await user.click(screen.getByRole('checkbox', { name: /remember me/ }));
    expect(screen.getByRole('checkbox', { name: /remember me/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Logged in.');
  });

  it('reports a failed login and lets the user try again', async () => {
    const user = await setup();
    await user.type(screen.getByLabelText('username'), 'admin{Enter}');
    await user.type(screen.getByLabelText('password'), 'nope{Enter}');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Login failed');
    await user.click(screen.getByRole('button', { name: 'Login failed, try again' }));
    expect(screen.getByLabelText('username')).toHaveFocus();
    expect(screen.getByLabelText('password')).toHaveValue('');
  });
});
