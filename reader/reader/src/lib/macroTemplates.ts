export type MacroTemplate = {
    id: string;
    label: string;
    icon?: string;
    color: string;
    text: string;
};

export const SMART_TAG_MACROS: Record<string, MacroTemplate[]> = {
    '#litrpg': [
        {
            id: 'litrpg-status',
            label: 'Status Window',
            color: 'bg-blue-500',
            text: `\n|Status|\nName: [Character Name]\nLevel: [##]\nClass: [Class Name]\nHP: [###/###]\nMP: [###/###]\n\nStrength: [##]\nAgility: [##]\nIntelligence: [##]\nEndurance: [##]\n\nActive Skills:\n- [Skill Name Lv.#]\n- [Skill Name Lv.#]\n\nPassive Skills:\n- [Skill Name Lv.#]\n|/Status|\n`
        },
        {
            id: 'litrpg-alert',
            label: 'System Alert',
            color: 'bg-indigo-500',
            text: `\n[System: Alert]\n> [Notification message here.]\n`
        },
        {
            id: 'litrpg-quest',
            label: 'Quest Log',
            color: 'bg-amber-500',
            text: `\n{Quest: [Quest Title]}\n\nObjective:\n- [Primary objective]\n\nOptional:\n- [Optional objective]\n\nRewards:\n- [XP Amount]\n- [Item/Skill/Title]\n\nPenalty:\n- [Failure consequence]\n`
        },
        {
            id: 'litrpg-skill',
            label: 'Skill Acquisition',
            color: 'bg-emerald-500',
            text: `\n[System: Skill Acquired]\n\nSkill: [Skill Name]\nType: [Active/Passive]\nDescription:\n[Brief skill description.]\n\nCooldown: [Time]\nCost: [Resource Cost]\n`
        }
    ],
    '#progressionfantasy': [
        {
            id: 'pf-breakthrough',
            label: 'Breakthrough Scene',
            color: 'bg-cyan-500',
            text: `\n--- Breakthrough Attempt ---\n\nCurrent Stage: [Stage Name]\nTarget Stage: [Stage Name]\n\nObstacle:\n[Describe bottleneck.]\n\nCatalyst:\n[Trigger or realization.]\n\nResult:\n[Success / Partial / Failure]\n\n----------------------------\n`
        },
        {
            id: 'pf-training',
            label: 'Training Log',
            color: 'bg-orange-500',
            text: `\n[Training Log - Day ##]\n\nFocus:\n[Skill/Technique]\n\nMethod:\n[Description]\n\nImprovement:\n[Measured change]\n\nSide Effects:\n[Strain / Insight / Setback]\n`
        },
        {
            id: 'pf-power',
            label: 'Power Comparison',
            color: 'bg-red-500',
            text: `\n--- Power Assessment ---\n\n[Character A]\nStage: [Level/Realm]\nCore Strength: [Descriptor]\n\nVS\n\n[Character B]\nStage: [Level/Realm]\nCore Strength: [Descriptor]\n\nEstimated Outcome:\n[Advantage / Even / Overwhelming]\n`
        }
    ],
    '#mystery': [
        {
            id: 'mystery-clue',
            label: 'Clue Log',
            color: 'bg-zinc-500',
            text: `\n[Clue Registered]\n\nLocation: [Where found]\nDescription:\n[What was discovered.]\n\nLinked To:\n- [Character/Event/Location]\n\nStatus:\n[Unresolved / Explained / Suspicious]\n`
        },
        {
            id: 'mystery-suspect',
            label: 'Suspect Profile',
            color: 'bg-purple-500',
            text: `\n--- Suspect Profile ---\n\nName: [Name]\nMotive:\n[Possible motive.]\n\nOpportunity:\n[How they could have done it.]\n\nAlibi:\n[Claimed timeline.]\n\nContradictions:\n[Inconsistencies.]\n`
        },
        {
            id: 'mystery-timeline',
            label: 'Timeline Entry',
            color: 'bg-yellow-600',
            text: `\n[Timeline Entry - Day ##, Time ##:##]\n\nEvent:\n[What occurred.]\n\nWitnesses:\n- [Name]\n\nAnomalies:\n[Anything unusual.]\n`
        }
    ],
    '#romance': [
        {
            id: 'romance-beat',
            label: 'Emotional Beat',
            color: 'bg-pink-500',
            text: `\n--- Emotional Beat ---\n\nTrigger:\n[What happened.]\n\nSurface Reaction:\n[Visible response.]\n\nInternal Reaction:\n[Hidden thoughts.]\n\nShift in Relationship:\n[Closer / Tension / Conflict]\n`
        },
        {
            id: 'romance-confession',
            label: 'Confession Scene Builder',
            color: 'bg-rose-500',
            text: `\n--- Confession Scene ---\n\nSetting:\n[Where it happens.]\n\nEmotional Stakes:\n[What could be lost.]\n\nObstacles:\n[Fear / Rival / Timing]\n\nConfession Line:\n"[Key line here.]"\n\nImmediate Response:\n[Reaction.]\n`
        },
        {
            id: 'romance-tracker',
            label: 'Relationship Tracker',
            color: 'bg-fuchsia-500',
            text: `\n[Relationship Status]\n\nCharacter A: [Name]\nCharacter B: [Name]\n\nCurrent Phase:\n[Strangers / Allies / Tension / Lovers / Fractured]\n\nUnresolved Conflict:\n[Issue.]\n\nNext Turning Point:\n[Planned scene.]\n`
        }
    ],
    '#horror': [
        {
            id: 'horror-distortion',
            label: 'Distortion Block',
            color: 'bg-stone-600',
            text: `\n--- Perceptual Distortion ---\n\nWhat Should Be There:\n[Normal expectation.]\n\nWhat Is There:\n[Distorted version.]\n\nSensory Detail:\n- Sound:\n- Smell:\n- Touch:\n\nEmotional Response:\n[Fear / Unease / Denial]\n`
        },
        {
            id: 'horror-reality',
            label: 'Reality Break Marker',
            color: 'bg-red-800',
            text: `\n[Reality Glitch Detected]\n\nTime Stamp:\n[Clock/time anomaly.]\n\nInconsistency:\n[What doesn't align.]\n\nCharacter Awareness:\n[Oblivious / Suspicious / Aware]\n`
        },
        {
            id: 'horror-spiral',
            label: 'Psychological Spiral',
            color: 'bg-violet-900',
            text: `\n--- Internal Spiral ---\n\nInitial Thought:\n[Minor doubt.]\n\nEscalation:\n[Growing paranoia.]\n\nIrrational Leap:\n[Extreme conclusion.]\n\nBehavioral Shift:\n[What they do next.]\n`
        }
    ]
};
