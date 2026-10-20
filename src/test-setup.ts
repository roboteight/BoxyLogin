import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no canvas to draw the typing bursts on
vi.mock('./explode', () => ({ explode: vi.fn() }));

afterEach(cleanup);
