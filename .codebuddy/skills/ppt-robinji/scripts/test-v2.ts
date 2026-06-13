#!/usr/bin/env node

// V2 Test - 14 Slide Types + Speech Methodology

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PPTCreator from '../src/pptx/creator.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

// 14 slide types demo with rich content
const v2Demo: PPTContent = {
  title: 'Why AI Will Transform Education by 2030',
  subtitle: 'A TED-Style Talk',
  estimatedDuration: 10,
  slides: [
    // 1. COVER with hook
    {
      title: '500 Million Students Will Learn Differently by 2030',
      type: 'cover',
      content: [
        'A TED-style talk on the future of learning',
        'Robinji | 2026'
      ],
      notes: '[PAUSE] 500 million. [EMPHASIS] That is the number of students whose education will be fundamentally different in less than 4 years. Not slightly different. Fundamentally.'
    },

    // 2. AGENDA
    {
      title: 'What We Will Cover',
      type: 'agenda',
      content: [
        'The crisis hiding in plain sight',
        'Three forces reshaping learning',
        'A day in 2030 classroom',
        'What this means for you'
      ],
      notes: 'Here is our roadmap. We will move fast but go deep.'
    },

    // 3. KPI - The shocking number
    {
      title: 'AI Education Market Will 10x in 5 Years',
      type: 'kpi',
      kpiValue: '$500B',
      kpiUnit: '',
      kpiContext: 'GLOBAL AI IN EDUCATION MARKET BY 2030',
      notes: '[EMPHASIS] Half a trillion dollars. For reference, that is larger than the entire GDP of Switzerland.'
    },

    // 4. CONTENT - The problem
    {
      title: 'One-Size-Fits-All Education is Failing 80% of Students',
      type: 'content',
      content: [
        'Standardized curriculum ignores individual learning pace',
        'Top 20% are bored, bottom 20% are left behind',
        'Teachers stretched across 30+ students with no time for personalization',
        'OECD data: 60% feel unprepared for modern workforce'
      ],
      notes: '[PAUSE] Think back to your own school experience. [INTERACT] How many of you felt truly engaged every single day? The honest answer for most of us is rare.'
    },

    // 5. QUOTE - Authority
    {
      title: 'Sir Ken Robinson',
      type: 'quote',
      content: ['We have a system of education that is modeled on the industrial age and designed to produce standardized outputs.'],
      quoteAuthor: 'Sir Ken Robinson',
      quoteSource: 'TED Talk, 2006',
      notes: 'This was true in 2006. It is even more true now. But the solution is finally here.'
    },

    // 6. PROCESS - 3 forces
    {
      title: 'Three Forces Converging to Reshape Learning',
      type: 'process',
      steps: [
        { title: 'AI Tutors', description: 'Personal AI for every student, 24/7' },
        { title: 'Adaptive Content', description: 'Curriculum that morphs to each learner' },
        { title: 'Real-time Analytics', description: 'Teachers see every student moment' }
      ],
      notes: 'These three forces are not happening in isolation. They are converging right now.'
    },

    // 7. COMPARISON - Before vs After
    {
      title: 'The 2026 Classroom vs The 2030 Classroom',
      type: 'comparison',
      comparisonA: {
        title: 'TODAY (2026)',
        items: [
          'One pace for 30 students',
          'Textbook written in 2018',
          'Teacher grades 100 papers/week',
          'No visibility into struggles'
        ]
      },
      comparisonB: {
        title: 'TOMORROW (2030)',
        items: [
          'Personalized pace per student',
          'AI-generated fresh content daily',
          'AI grades, teaches mentor',
          'Real-time struggle detection'
        ]
      },
      notes: '[PAUSE] Read both columns. [EMPHASIS] This is not a future we are predicting. This future is being built in classrooms right now.'
    },

    // 8. CHART - Data
    {
      title: 'AI Tutor Effectiveness vs Human Tutor',
      type: 'chart',
      content: ['Average learning gain in months after 6-month intervention'],
      chartData: {
        type: 'bar',
        title: 'Learning Gain',
        labels: ['No Tutor', 'Human Tutor', 'AI Tutor', 'AI + Human'],
        values: [1.2, 4.5, 6.8, 9.2]
      },
      notes: 'Data from Stanford 2025 study with 12,000 students. [EMPHASIS] Notice the last bar. The future is not AI replacing teachers. It is AI amplifying them.'
    },

    // 9. TIMELINE - Adoption curve
    {
      title: 'We Are at the Inflection Point',
      type: 'timeline',
      events: [
        { date: '2023', title: 'ChatGPT Launch', description: 'Generative AI goes mainstream' },
        { date: '2024', title: 'Pilot Programs', description: 'Top 100 schools begin AI tutoring pilots' },
        { date: '2026', title: 'Mass Adoption', description: '50% of US schools use AI tutors' },
        { date: '2028', title: 'Mainstream', description: 'AI tutoring becomes default' },
        { date: '2030', title: 'Universal', description: '500M students have AI access' }
      ],
      notes: '[EMPHASIS] We are right here. The next 4 years will determine the next 40 years of education.'
    },

    // 10. DIVIDER - Section break
    {
      title: 'What This Means for You',
      type: 'divider',
      content: ['PART 2']
    },

    // 11. CONTENT - For teachers
    {
      title: 'For Teachers: You Will Not Be Replaced, You Will Be Amplified',
      type: 'content',
      content: [
        'AI handles routine: grading, lesson planning, admin',
        'You focus on what humans do best: inspire, mentor, empathize',
        'Class of 30 becomes 30 personalized learning journeys',
        'Your impact multiplies 5-10x with AI as your partner'
      ],
      notes: '[INTERACT] Any teachers in the audience? [PAUSE] Your job is about to become more human, not less.'
    },

    // 12. CONCLUSION
    {
      title: 'Three Things to Remember',
      type: 'conclusion',
      content: [
        'AI education is happening NOW, not in the future',
        'It will amplify humans, not replace them',
        'The next 4 years will reshape 40 years of education'
      ],
      notes: 'If you remember nothing else, remember these three points.'
    },

    // 13. CTA - Specific action
    {
      title: 'Join the Movement',
      type: 'cta',
      content: [
        'Visit our open-source AI tutor project',
        'github.com/robinji-ai-tutor'
      ],
      notes: '[EMPHASIS] Do not just watch this revolution. Build it with us. Star the repo, contribute, deploy in your school.'
    },

    // 14. Q&A
    {
      title: 'Questions, Challenges, Skepticism All Welcome',
      type: 'qa'
    }
  ]
};

async function main() {
  console.log('=====================================================');
  console.log('  ppt-robinji V2 Test - 14 Slide Types');
  console.log('=====================================================');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 测试多个模板
  const templates = ['business-classic', 'tech-neon', 'creative-aurora', 'minimal-paper', 'gradient-ocean'];

  for (const tpl of templates) {
    const outputPath = join(OUTPUT_DIR, `v2-${tpl}.pptx`);
    const creator = new PPTCreator({ template: tpl, author: 'v2-speech-test' });
    await creator.createFromOutline(v2Demo);
    await creator.save(outputPath);
    const stats = statSync(outputPath);
    console.log(`[OK] [${tpl.padEnd(20)}] ${(stats.size / 1024).toFixed(1).padStart(6)} KB - ${v2Demo.slides.length} slides`);
  }

  console.log('\n[Done] V2 Test Complete!');
  console.log('\nSlide types tested:');
  const types = new Set(v2Demo.slides.map(s => s.type));
  types.forEach(t => console.log(`  - ${t}`));
  console.log(`\nTotal unique types: ${types.size}`);
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
