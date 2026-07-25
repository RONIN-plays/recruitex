export interface MonitoringData {
  eyeTracking: 'good' | 'warning' | 'alert';
  faceVisibility: 'complete' | 'partial' | 'not_visible';
  faceCount: number;
}

export type UserProfile = 'baseline_candidate' | 'distracted_candidate' | 'cheating_candidate' | 'technical_issues_candidate';

export type Violation = {
  timestamp: number;
  type: "warning" | "critical";
  message: string;
};

export type MonitoringProfile = {
  id: string;
  description: string;
  simulatedViolations: Violation[];
  monitoringSequence: MonitoringData[];
};

export const monitoringProfiles: MonitoringProfile[] = [
  {
    id: "baseline_candidate",
    description: "Normal candidate, no violations detected.",
    simulatedViolations: [],
    monitoringSequence: [
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 }
    ]
  },
  {
    id: "distracted_candidate",
    description: "Candidate looks away or changes window multiple times.",
    simulatedViolations: [
      { timestamp: 15, type: "warning", message: "Candidate looked away briefly." },
      { timestamp: 45, type: "warning", message: "Window out of focus." },
      { timestamp: 75, type: "warning", message: "Face partially visible." },
      { timestamp: 120, type: "warning", message: "Distracted behavior detected." },
      { timestamp: 180, type: "warning", message: "Eyes not focused on screen." },
      { timestamp: 240, type: "warning", message: "Head movement detected - looking around." }
    ],
    monitoringSequence: [
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'warning', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'alert', faceVisibility: 'partial', faceCount: 1 },
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 1 }, // Looking away but face visible
      { eyeTracking: 'warning', faceVisibility: 'partial', faceCount: 1 },
      { eyeTracking: 'alert', faceVisibility: 'not_visible', faceCount: 0 }, // Turned away completely
      { eyeTracking: 'warning', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 }
    ]
  },
  {
    id: "cheating_candidate",
    description: "Candidate attempts to use external help or switch screens frequently.",
    simulatedViolations: [
      { timestamp: 10, type: "warning", message: "Multiple faces detected." },
      { timestamp: 25, type: "critical", message: "Browser switched to unauthorized tab." },
      { timestamp: 60, type: "critical", message: "External voice detected." },
      { timestamp: 90, type: "critical", message: "Multiple people in frame." },
      { timestamp: 120, type: "critical", message: "Someone else appeared in camera." },
      { timestamp: 150, type: "critical", message: "Suspicious eye movement patterns." },
      { timestamp: 200, type: "critical", message: "4+ faces detected - clear violation." }
    ],
    monitoringSequence: [
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 2 }, // Helper appears
      { eyeTracking: 'warning', faceVisibility: 'partial', faceCount: 1 }, // Helper leaves
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 3 }, // Multiple helpers
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 }, // Back to normal
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 2 }, // Helper returns
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 4 }, // Group cheating
      { eyeTracking: 'alert', faceVisibility: 'complete', faceCount: 2 } // Reduced but still cheating
    ]
  },
  {
    id: "technical_issues_candidate",
    description: "Candidate experiences technical difficulties with camera/connection.",
    simulatedViolations: [
      { timestamp: 20, type: "warning", message: "Camera connection unstable." },
      { timestamp: 50, type: "warning", message: "No face detected due to technical issues." },
      { timestamp: 100, type: "warning", message: "Poor video quality detected." },
      { timestamp: 140, type: "warning", message: "Audio connection issues." }
    ],
    monitoringSequence: [
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'not_visible', faceCount: 0 },
      { eyeTracking: 'warning', faceVisibility: 'partial', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'not_visible', faceCount: 0 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 },
      { eyeTracking: 'warning', faceVisibility: 'not_visible', faceCount: 0 },
      { eyeTracking: 'good', faceVisibility: 'partial', faceCount: 1 },
      { eyeTracking: 'good', faceVisibility: 'complete', faceCount: 1 }
    ]
  }
];

/**
 * Creates a parameterized monitoring function for testing
 * @param profile - The monitoring profile to simulate
 * @returns A function that returns monitoring data based on elapsed time
 */
export const createParameterizedMonitoringTest = (profile: MonitoringProfile) => {
  return (elapsedTime: number): MonitoringData => {
    const sequenceIndex = Math.floor(elapsedTime / 5000) % profile.monitoringSequence.length; // Change every 5 seconds
    return profile.monitoringSequence[sequenceIndex];
  };
};

/**
 * Gets a monitoring profile by ID
 */
export const getMonitoringProfile = (profileId: string): MonitoringProfile | undefined => {
  return monitoringProfiles.find(profile => profile.id === profileId);
};