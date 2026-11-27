import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildNoAnswerMessage,
  generateFollowUps,
} from '../src/lib/rag/followups';
import { validatePassword } from '../src/lib/password-policy';

test('password policy requires length, letters, and numbers', () => {
  assert.equal(validatePassword('short1'), 'Password must be at least 10 characters.');
  assert.match(validatePassword('abcdefghij') || '', /letter and one number/);
  assert.match(validatePassword('1234567890') || '', /letter and one number/);
  assert.equal(validatePassword('correct-horse-9'), null);
});

test('no-answer suggestions use actual sources instead of demo topics', () => {
  const message = buildNoAnswerMessage(
    ['MTN Nigeria Call Records.xlsx', 'HR Policy.pdf'],
    ['Spreadsheet', 'Policy'],
  );
  assert.match(message, /MTN Nigeria Call Records/);
  assert.match(message, /HR Policy/);
  assert.doesNotMatch(message, /Cisco/);
});

test('no-answer follow-ups stay grounded in the available files', () => {
  const followUps = generateFollowUps({
    question: 'who is mr banks',
    answer: "I couldn't find support for that in the uploaded documents.",
    intent: 'factual_lookup',
    filenames: ['MTN Nigeria Call Records.xlsx', 'HR Policy.pdf'],
    documentCategories: ['Spreadsheet', 'Policy'],
    noAnswer: true,
  });

  assert.ok(followUps.length > 0);
  assert.ok(followUps.length <= 3);
  assert.ok(followUps.some((item) => item.includes('MTN Nigeria Call Records')));
});
