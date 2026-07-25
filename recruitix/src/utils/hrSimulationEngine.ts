export interface SimulationEvent {
  time: number;
  expression: 'happy' | 'neutral' | 'concerned';
  confidence: number;
  clarity: number;
}

/**
 * Repeatable HR simulation engine with deterministic behavior events
 * This allows for reproducible experiments and testing
 */
export const hrSimulationEventLog: SimulationEvent[] = [
  { time: 0, expression: 'neutral', confidence: 75, clarity: 80 },
  { time: 3000, expression: 'happy', confidence: 85, clarity: 85 },
  { time: 6000, expression: 'neutral', confidence: 78, clarity: 82 },
  { time: 9000, expression: 'concerned', confidence: 65, clarity: 75 },
  { time: 12000, expression: 'neutral', confidence: 80, clarity: 88 },
  { time: 15000, expression: 'happy', confidence: 88, clarity: 90 },
  { time: 18000, expression: 'neutral', confidence: 76, clarity: 85 },
  { time: 21000, expression: 'concerned', confidence: 68, clarity: 78 },
  { time: 24000, expression: 'neutral', confidence: 82, clarity: 87 },
  { time: 27000, expression: 'happy', confidence: 90, clarity: 92 },
  { time: 30000, expression: 'neutral', confidence: 79, clarity: 84 },
  { time: 33000, expression: 'concerned', confidence: 70, clarity: 80 },
  { time: 36000, expression: 'happy', confidence: 87, clarity: 89 },
  { time: 39000, expression: 'neutral', confidence: 81, clarity: 86 },
  { time: 42000, expression: 'happy', confidence: 92, clarity: 94 }
];

/**
 * Creates a repeatable simulation engine
 * @param eventLog - Array of simulation events with timestamps
 * @returns Function that returns current simulation state based on elapsed time
 */
export const createRepeatableSimulationEngine = (eventLog: SimulationEvent[] = hrSimulationEventLog) => {
  return (elapsedTime: number): SimulationEvent => {
    // Find the appropriate event from the log
    const currentEvent = eventLog.find((event, index) => {
      const nextEvent = eventLog[index + 1];
      return elapsedTime >= event.time && (!nextEvent || elapsedTime < nextEvent.time);
    }) || eventLog[eventLog.length - 1];
    
    return currentEvent;
  };
};

/**
 * Alternative simulation profiles for different interview scenarios
 */
export const simulationProfiles = {
  confident_candidate: [
    { time: 0, expression: 'happy' as const, confidence: 85, clarity: 90 },
    { time: 5000, expression: 'happy' as const, confidence: 88, clarity: 92 },
    { time: 10000, expression: 'neutral' as const, confidence: 82, clarity: 88 },
    { time: 15000, expression: 'happy' as const, confidence: 90, clarity: 95 },
    { time: 20000, expression: 'happy' as const, confidence: 87, clarity: 91 }
  ],
  nervous_candidate: [
    { time: 0, expression: 'concerned' as const, confidence: 60, clarity: 65 },
    { time: 5000, expression: 'neutral' as const, confidence: 70, clarity: 72 },
    { time: 10000, expression: 'concerned' as const, confidence: 65, clarity: 68 },
    { time: 15000, expression: 'neutral' as const, confidence: 75, clarity: 78 },
    { time: 20000, expression: 'happy' as const, confidence: 80, clarity: 82 }
  ],
  balanced_candidate: hrSimulationEventLog
};