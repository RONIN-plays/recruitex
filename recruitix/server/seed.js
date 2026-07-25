// Seeds companies + a shared placeholder question bank (same content migrated once already
// for the superseded Postgres plan). All four companies point at the same question set for
// now — replace per-company content later directly in MongoDB, no schema change needed.
import 'dotenv/config';
import { getDb } from './db.js';

const COMPANIES = [
  { name: 'TCS', slug: 'tcs' },
  { name: 'Wipro', slug: 'wipro' },
  { name: 'Infosys', slug: 'infosys' },
  { name: 'General', slug: 'general' },
].map((c) => ({
  ...c,
  passThresholdPct: 60,
  technicalDurationMin: 60,
  personalDurationMin: 45,
  hrDurationMin: 20,
  isActive: true,
  createdAt: new Date(),
}));

const TECHNICAL_QUESTIONS = [
  { qtype: 'mcq', category: 'DSA', prompt: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', points: 2 },
  { qtype: 'mcq', category: 'DSA', prompt: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Tree'], correctAnswer: 'Stack', points: 2 },
  { qtype: 'mcq', category: 'DSA', prompt: 'What is the worst-case time complexity of quicksort?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correctAnswer: 'O(n²)', points: 2 },
  { qtype: 'mcq', category: 'DSA', prompt: 'Which traversal technique is used in DFS?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 'Stack', points: 2 },
  { qtype: 'mcq', category: 'DSA', prompt: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 'O(n)', points: 2 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'If a train travels 120 km in 2 hours, what is its speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correctAnswer: '60 km/h', points: 1 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'A man can complete a work in 12 days. How much work can he complete in 3 days?', options: ['1/4', '1/3', '1/2', '2/3'], correctAnswer: '1/4', points: 1 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'The ratio of 3:4 is equal to?', options: ['12:16', '6:9', '9:12', '15:18'], correctAnswer: '12:16', points: 1 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'If 5 books cost $25, what is the cost of 8 books?', options: ['$35', '$40', '$45', '$50'], correctAnswer: '$40', points: 1 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'What comes next in the series: 2, 6, 12, 20, ?', options: ['28', '30', '32', '34'], correctAnswer: '30', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'What is 15% of 240?', options: ['36', '32', '38', '34'], correctAnswer: '36', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'If x + y = 10 and x - y = 4, what is the value of x?', options: ['6', '7', '8', '9'], correctAnswer: '7', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'What is the area of a circle with radius 7?', options: ['154', '144', '164', '174'], correctAnswer: '154', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'If log₂(8) = x, what is x?', options: ['2', '3', '4', '5'], correctAnswer: '3', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'What is the compound interest on $1000 at 10% for 2 years?', options: ['$200', '$210', '$220', '$230'], correctAnswer: '$210', points: 1 },
  { qtype: 'coding', category: 'DSA', prompt: 'Write a function to reverse a linked list.', options: null, correctAnswer: 'iterative or recursive approach', points: 5 },
  { qtype: 'coding', category: 'DSA', prompt: 'Implement binary search algorithm.', options: null, correctAnswer: 'divide and conquer approach', points: 5 },
  { qtype: 'coding', category: 'DSA', prompt: 'Find the maximum element in an array.', options: null, correctAnswer: 'iterate through array', points: 3 },
  { qtype: 'coding', category: 'DSA', prompt: 'Check if a string is palindrome.', options: null, correctAnswer: 'two pointer approach', points: 3 },
  { qtype: 'coding', category: 'DSA', prompt: 'Implement stack using arrays.', options: null, correctAnswer: 'push, pop, top operations', points: 4 },
  { qtype: 'mcq', category: 'DSA', prompt: 'What is the height of a complete binary tree with n nodes?', options: ['log₂(n)', '⌊log₂(n)⌋', '⌈log₂(n+1)⌉', 'n'], correctAnswer: '⌊log₂(n)⌋', points: 2 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'A pipe can fill a tank in 6 hours. Another pipe can empty it in 8 hours. How long to fill the tank if both are open?', options: ['24 hours', '20 hours', '18 hours', '16 hours'], correctAnswer: '24 hours', points: 1 },
  { qtype: 'mcq', category: 'Quant', prompt: 'What is the probability of getting a head when flipping a fair coin?', options: ['0.25', '0.5', '0.75', '1'], correctAnswer: '0.5', points: 1 },
  { qtype: 'mcq', category: 'DSA', prompt: 'Which sorting algorithm is stable?', options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'], correctAnswer: 'Merge Sort', points: 2 },
  { qtype: 'mcq', category: 'Aptitude', prompt: 'If today is Monday, what day will it be after 100 days?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], correctAnswer: 'Tuesday', points: 1 },
];

const PERSONAL_QUESTIONS = [
  { prompt: 'Implement a function to reverse a linked list.', correctAnswer: 'Iterative or recursive reversal', points: 10 },
  { prompt: 'Find the longest palindromic substring in a given string.', correctAnswer: 'Expand around centers or dynamic programming', points: 10 },
  { prompt: 'Implement binary search in a sorted array.', correctAnswer: 'Divide and conquer with two pointers', points: 8 },
  { prompt: 'Detect if a linked list has a cycle.', correctAnswer: "Floyd's cycle detection (tortoise and hare)", points: 10 },
  { prompt: 'Find the maximum depth of a binary tree.', correctAnswer: 'Recursive DFS or iterative BFS', points: 8 },
  { prompt: 'Merge two sorted arrays in-place.', correctAnswer: 'Two pointers from end to beginning', points: 10 },
  { prompt: 'Find the first non-repeating character in a string.', correctAnswer: 'Hash map for frequency counting', points: 8 },
  { prompt: 'Implement a stack using queues.', correctAnswer: 'Two queues or one queue with rotation', points: 10 },
  { prompt: 'Find the kth largest element in an array.', correctAnswer: 'Quick select or heap', points: 10 },
  { prompt: 'Check if two strings are anagrams.', correctAnswer: 'Sorting or character frequency counting', points: 8 },
].map((q) => ({ ...q, qtype: 'coding', category: 'DSA', options: null }));

const HR_QUESTIONS = [
  { prompt: "Tell me about yourself and why you're interested in this position.", correctAnswer: 'background experience skills interest role motivation career goals' },
  { prompt: 'Describe a challenging situation you faced and how you overcame it.', correctAnswer: 'challenge problem obstacle solution action result overcame learned' },
  { prompt: 'Where do you see yourself in five years?', correctAnswer: 'career growth goals development future plan aspiration' },
  { prompt: 'What are your greatest strengths and weaknesses?', correctAnswer: 'strength weakness self awareness improvement skill' },
  { prompt: 'Why should we hire you over other candidates?', correctAnswer: 'unique value skills experience fit contribution strength' },
  { prompt: 'Describe a time when you had to work in a team to achieve a goal.', correctAnswer: 'team collaboration goal cooperation communication result' },
  { prompt: 'How do you handle stress and pressure?', correctAnswer: 'stress pressure manage cope prioritize calm strategy' },
  { prompt: 'What motivates you in your work?', correctAnswer: 'motivation passion drive purpose reward growth' },
  { prompt: 'Tell me about a time you failed and what you learned from it.', correctAnswer: 'failure mistake lesson learned improvement growth reflection' },
  { prompt: 'How do you stay updated with industry trends and technologies?', correctAnswer: 'learning trends technology industry courses reading updated' },
].map((q) => ({ ...q, qtype: 'behavioral', category: 'Behavioral', options: null, points: 1 }));

async function seed() {
  const db = await getDb();

  for (const company of COMPANIES) {
    await db.collection('companies').updateOne({ slug: company.slug }, { $setOnInsert: company }, { upsert: true });
  }

  const companies = await db.collection('companies').find({}).toArray();
  const now = new Date();

  for (const company of companies) {
    const existingCount = await db.collection('questionBank').countDocuments({ companyId: company._id });
    if (existingCount > 0) continue; // already seeded for this company

    const docs = [
      ...TECHNICAL_QUESTIONS.map((q) => ({ ...q, companyId: company._id, round: 'technical', createdAt: now })),
      ...PERSONAL_QUESTIONS.map((q) => ({ ...q, companyId: company._id, round: 'personal', createdAt: now })),
      ...HR_QUESTIONS.map((q) => ({ ...q, companyId: company._id, round: 'hr', createdAt: now })),
    ];
    await db.collection('questionBank').insertMany(docs);
    // eslint-disable-next-line no-console
    console.log(`Seeded ${docs.length} questions for ${company.name}`);
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
