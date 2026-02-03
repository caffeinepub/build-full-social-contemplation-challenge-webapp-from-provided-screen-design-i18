/**
 * Fixed assignment definitions for the 7-day Social Contemplation challenge.
 * Each day has exactly 5 assignments with the same titles and content.
 */

export interface Assignment {
  id: string;
  title: string;
  content: string;
}

/**
 * The 5 fixed assignments that appear every day.
 * Content transcribed from the provided screenshots.
 */
export const FIXED_ASSIGNMENTS: Assignment[] = [
  {
    id: 'awareness',
    title: 'Awareness',
    content: `Step 1: Observe Your Screen Time
Open your screen time app and take a few minutes to observe your usage patterns. Notice how much time you spend, which apps you use most, and how this makes you feel.

Step 2: Reflect, Compare, and Record
Make a short audio recording (1–3 minutes) in which you reflect on what you noticed. Compare your current screen behavior with your goals or intended behavior. Where do they align? Where do they differ? Describe your observations, feelings, and any surprises. Upload your recording in this step.

Step 3: Review and Deepen
During your contemplation ritual, repeat this exercise. Listen to your previous recordings and, if relevant, to those of others. Then make a new recording, reflecting on any changes or new insights. This iterative process helps deepen your awareness and understanding over time.`,
  },
  {
    id: 'utopia',
    title: 'Utopia',
    content: `Step 1: Imagine Your Ideal Screen Life
Take a moment to imagine a future in which everything is aligned perfectly. You have full freedom, full control, and act exactly as you would ideally want to. How do you use your screen in this scenario?

Step 2: Describe Your True North
Make a short audio recording (1–3 minutes) in which you describe your ideal screen life in detail. What does a perfect day look like? Which apps do you use, when, and why? How does this way of using your screen support your values, energy, and well-being?

Step 3: Anchor the Vision
Listen back to your recording during your contemplation ritual. Let this vision function as your true north — a reference point you can return to when reflecting on your current habits and future changes.`,
  },
  {
    id: 'small-steps',
    title: 'Small Steps',
    content: `Step 1: Assess Your Current State
Look at your current drawing of your screen habits. Give yourself a rating from 0 to 10 that reflects how satisfied you are with your current screen behavior.

Step 2: Reflect and Record
Make a short audio recording (1–3 minutes) in which you reflect on how you could increase this rating by just a small step. For example, if you rate yourself a 5, what would a 5.5 or 6 look like in practice? Focus on small, realistic changes rather than big transformations.

Step 3: Anchor the Next Step
Listen back to your recording during your contemplation ritual. Let these small steps function as gentle guides for action — subtle adjustments you can return to and experiment with in daily life.`,
  },
  {
    id: 'support-strategies',
    title: 'Support Strategies',
    content: `Step 1: Identify Support Strategies
Support strategies are small changes to your environment that make your desired screen behavior easier and more natural.

Instead of relying on willpower, you design your physical, social, and digital surroundings to support you.

Reflect on moments when you automatically reach for your screen — where could your environment help you act differently?

Step 2: Reflect, Share, and Record
Make a short audio recording (1–3 minutes) exploring your personal support strategies. Everyone's strategies are different, so focus on what would realistically work for you.

Be creative and aim for small, practical changes. Listen to others' strategies for inspiration and adapt ideas that resonate with your own situation.

Step 3: Anchor Your Strategies
Listen back to your recording during your contemplation ritual. Use these strategies as a personal support system — small interventions you can experiment with and refine over time.`,
  },
  {
    id: 'other-contemplations',
    title: 'Other Contemplations',
    content: `Step 1: Notice What Extends Beyond
Reflect on your process so far. Are there thoughts, experiences, or insights about your screen behavior that extend beyond the exercises? Notice what has emerged along the way — ideas that feel relevant, but not captured by a specific task.

Step 2: Reflect and Record
Make a short audio recording (1–3 minutes) in which you explore these broader contemplations. This is an open space: you can speak about connections to other parts of your life, lingering questions, emotions, or intuitions that feel important.

Step 3: Anchor Your Reflections
Listen back to your recording during your contemplation ritual. Let this exercise function as a gentle overflow space — where what is still unfolding can exist without needing to be structured or resolved.`,
  },
];

/**
 * Get all assignments for a given day (1-7).
 * Returns the same 5 assignments for every day.
 */
export function getAssignmentsForDay(day: number): Assignment[] {
  // Clamp day to valid range (1-7)
  const clampedDay = Math.max(1, Math.min(7, day));
  
  // All days have the same assignments
  return FIXED_ASSIGNMENTS;
}

/**
 * Get a specific assignment by ID.
 */
export function getAssignmentById(id: string): Assignment | undefined {
  return FIXED_ASSIGNMENTS.find(a => a.id === id);
}

/**
 * Validate that a day is within the allowed range (1-7).
 */
export function isValidDay(day: number): boolean {
  return day >= 1 && day <= 7;
}

/**
 * Clamp a day value to the valid range (1-7).
 */
export function clampDay(day: number): number {
  return Math.max(1, Math.min(7, day));
}
