import json

question_bank = {
    "performance":[
            "Do you feel your recent performance rating reflects your efforts accurately?",
            "Are there any specific challenges preventing you from meeting your goals?",
            "How has the feedback from your manager affected your mood lately?",
            "Do you feel supported in improving your performance where needed?",
            "Are your goals feeling achievable with your current resources and workload?",
            "Do you think your performance expectations align with your day-to-day responsibilities?"
    ],
    "vibemeter":[
            "You’ve reported feeling [insert mood, e.g., Frustrated/Sad/Happy] lately—what’s been the biggest factor?",
            "What’s one thing that stood out today influencing your mood?",
            "How long have you been feeling this way, and has anything specific triggered it?",
            "Is there something we can do to help shift your vibe to a more positive zone?",
            "Are there any recent changes at work or home that might be impacting your vibe?",
            "What’s one thing that could make your day feel better right now?"
    ],
    "leave":[
            "Have you been able to take sufficient leave recently, or do you feel constrained by your schedule?",
            "Do you think more time off could help improve how you’re feeling right now?",
            "Is your workload making it difficult to plan or take breaks?",
            "Have you noticed a change in your mood since your last leave?",
            "Are you hesitant to request leave due to team pressures or deadlines?",
            "How do you feel your leave balance compares to your current needs?"
    ],
    "rewards":[
            "Do you feel your recent contributions have been adequately recognized?",
            "How do you think the current rewards system impacts your motivation?",
            "Is there a specific achievement you feel went unnoticed?",
            "What type of recognition would make you feel more valued?",
            "Have you seen others being rewarded in ways that feel fair to you?",
            "Does the timing of recognition affect how meaningful it feels to you?"
    ],
    "onboarding":[
            "Looking back, how well do you think your onboarding prepared you for your role?",
            "Did you feel welcomed and supported when you first joined the team?",
            "Are there any onboarding experiences still affecting how you feel today?",
            "What could have made your transition into the company smoother?",
            "Did you have enough clarity on your role and team dynamics when you started?",
            "How connected did you feel to your team during your first few weeks?"
    ],
    "activity_tracker":[
            "Do you feel your current workload is sustainable, or is it overwhelming you?",
            "How do your recent hours on Teams/Outlook correlate with your stress levels?",
            "Are there specific tasks or days that feel particularly draining for you?",
            "Do you get enough downtime between your daily activities to recover?",
            "Have you noticed a pattern between your activity spikes and your energy levels?",
            "Is there a particular project or task that’s been taking up more of your time lately?"
    ]

}
QB = {
    "leave_dataset": {
        "description": "Questions to explore leave patterns and their impact on well-being.",
        "questions": [
            "Have you been able to take sufficient leave recently, or do you feel constrained by your schedule?",
            "Do you think more time off could help improve how you’re feeling right now?",
            "Is your workload making it difficult to plan or take breaks?",
            "Have you noticed a change in your mood since your last leave?",
            "Are you hesitant to request leave due to team pressures or deadlines?",
            "How do you feel your leave balance compares to your current needs?"
        ]
    },
    "activity_tracker": {
        "description": "Questions to assess workload, stress, and daily activity impact.",
        "questions": [
            "Do you feel your current workload is sustainable, or is it overwhelming you?",
            "How do your recent hours on Teams/Outlook correlate with your stress levels?",
            "Are there specific tasks or days that feel particularly draining for you?",
            "Do you get enough downtime between your daily activities to recover?",
            "Have you noticed a pattern between your activity spikes and your energy levels?",
            "Is there a particular project or task that’s been taking up more of your time lately?"
        ]
    },
    "performance_dataset": {
        "description": "Questions to understand performance-related concerns and feedback.",
        "questions": [
            "Do you feel your recent performance rating reflects your efforts accurately?",
            "Are there any specific challenges preventing you from meeting your goals?",
            "How has the feedback from your manager affected your mood lately?",
            "Do you feel supported in improving your performance where needed?",
            "Are your goals feeling achievable with your current resources and workload?",
            "Do you think your performance expectations align with your day-to-day responsibilities?"
        ]
    },
    "rewards_dataset": {
        "description": "Questions to gauge satisfaction with recognition and rewards.",
        "questions": [
            "Do you feel your recent contributions have been adequately recognized?",
            "How do you think the current rewards system impacts your motivation?",
            "Is there a specific achievement you feel went unnoticed?",
            "What type of recognition would make you feel more valued?",
            "Have you seen others being rewarded in ways that feel fair to you?",
            "Does the timing of recognition affect how meaningful it feels to you?"
        ]
    },
    "onboarding_dataset": {
        "description": "Questions to reflect on onboarding and its long-term effects.",
        "questions": [
            "Looking back, how well do you think your onboarding prepared you for your role?",
            "Did you feel welcomed and supported when you first joined the team?",
            "Are there any onboarding experiences still affecting how you feel today?",
            "What could have made your transition into the company smoother?",
            "Did you have enough clarity on your role and team dynamics when you started?",
            "How connected did you feel to your team during your first few weeks?"
        ]
    },
    "vibemeter_dataset": {
        "description": "Questions to dive deeper into daily mood and its causes.",
        "questions": [
            "You’ve reported feeling [insert mood, e.g., Frustrated/Sad/Happy] lately—what’s been the biggest factor?",
            "What’s one thing that stood out today influencing your mood?",
            "How long have you been feeling this way, and has anything specific triggered it?",
            "Is there something we can do to help shift your vibe to a more positive zone?",
            "Are there any recent changes at work or home that might be impacting your vibe?",
            "What’s one thing that could make your day feel better right now?"
        ]
    },
    "cross_dataset_correlation": {
        "description": "Questions combining multiple data sources for deeper insights.",
        "questions": [
            "You’ve been working long hours lately and haven’t taken much leave—do you think this is affecting your mood?",
            "Your performance rating was high, but your vibe is low—do you feel your efforts are being recognized?",
            "You’ve been active on Teams late at night—could this be linked to feeling frustrated or tired?",
            "Since your onboarding, your activity levels have spiked—do you feel adequately supported in managing this?",
            "Your rewards data shows no recent recognition despite high activity—does this feel fair to you?",
            "With fewer leaves and a dip in your vibe, do you think burnout might be creeping in?"
        ]
    },
    "escalation_triggers": {
        "description": "Questions to identify serious concerns requiring HR intervention.",
        "questions": [
            "Are you feeling consistently overwhelmed or unsupported in a way that’s hard to manage?",
            "Is there something happening at work that’s making it difficult for you to stay engaged?",
            "Do you feel comfortable sharing if something serious is impacting your well-being?",
            "Would you like me to connect you with someone from HR to discuss this further?",
            "Have you been feeling this way for a while without seeing improvement?",
            "Is there a recurring issue that’s making work feel unsustainable for you?"
        ]
    },
    "team_dynamics": {
        "description": "Questions to explore team-related influences on vibe.",
        "questions": [
            "How do you feel your team’s support has been affecting your mood lately?",
            "Is there anything about your team’s collaboration that’s been frustrating or motivating?",
            "Do you feel comfortable raising concerns with your team or manager?",
            "Has a recent team change or project impacted how you’re feeling?"
        ]
    }
}