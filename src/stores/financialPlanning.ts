import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useInvestmentStore } from './investment.ts';
import { useAccountsStore } from './account.ts';

export interface FIREMetrics {
    currentAge: number;
    targetRetirementAge: number;
    yearsToRetirement: number;
    currentNetWorth: number;
    targetFIRENumber: number;
    monthlyExpenses: number;
    monthlyIncome: number;
    monthlySavings: number;
    savingsRate: number;
    projectedRetirementAge: number;
    onTrackToRetirement: boolean;
}

export interface BudgetToInvestmentFlow {
    monthlyBudgetSurplus: number;
    monthlyInvestmentContribution: number;
    automaticInvestmentRate: number;
    emergencyFundTarget: number;
    emergencyFundCurrent: number;
    emergencyFundMonths: number;
}

export interface RetirementProjection {
    year: number;
    age: number;
    portfolioValue: number;
    monthlyIncome: number;
    cumulativeContributions: number;
    cumulativeGrowth: number;
}

export interface GoalTracker {
    goalId: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    monthlyContribution: number;
    progress: number;
    onTrack: boolean;
    projectedCompletionDate: Date;
}

export const useFinancialPlanningStore = defineStore('financialPlanning', () => {
    const investmentStore = useInvestmentStore();
    const accountsStore = useAccountsStore();

    // User profile data
    const userProfile = ref({
        currentAge: 35,
        targetRetirementAge: 55, // Early retirement goal
        monthlyExpenses: 400000, // $4,000 in cents
        monthlyIncome: 800000,   // $8,000 in cents
        emergencyFundMonths: 6,
        expectedAnnualReturn: 0.07, // 7% annual return
        inflationRate: 0.03, // 3% inflation
        safeWithdrawalRate: 0.04 // 4% rule
    });

    // Financial goals
    const goals = ref<GoalTracker[]>([
        {
            goalId: '1',
            title: 'Emergency Fund',
            targetAmount: userProfile.value.monthlyExpenses * userProfile.value.emergencyFundMonths,
            currentAmount: 150000, // $1,500
            targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            monthlyContribution: 50000, // $500
            progress: 0,
            onTrack: true,
            projectedCompletionDate: new Date()
        },
        {
            goalId: '2', 
            title: 'FIRE Target',
            targetAmount: userProfile.value.monthlyExpenses * 12 * 25, // 25x annual expenses
            currentAmount: investmentStore.portfolioSummary?.currentValue || 0,
            targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + (userProfile.value.targetRetirementAge - userProfile.value.currentAge))),
            monthlyContribution: 200000, // $2,000
            progress: 0,
            onTrack: false,
            projectedCompletionDate: new Date()
        }
    ]);

    // Computed FIRE metrics
    const fireMetrics = computed<FIREMetrics>(() => {
        const currentNetWorth = accountsStore.getTotalAssets(true) as number || 0;
        const targetFIRENumber = userProfile.value.monthlyExpenses * 12 * 25; // 25x rule
        const monthlySavings = userProfile.value.monthlyIncome - userProfile.value.monthlyExpenses;
        const savingsRate = userProfile.value.monthlyIncome > 0 ? 
            (monthlySavings / userProfile.value.monthlyIncome) * 100 : 0;
        
        // Calculate years to FIRE using compound growth
        const remainingAmount = targetFIRENumber - currentNetWorth;
        const monthlyReturn = userProfile.value.expectedAnnualReturn / 12;
        const yearsToFIRE = calculateYearsToGoal(remainingAmount, monthlySavings, monthlyReturn);
        
        const projectedRetirementAge = userProfile.value.currentAge + yearsToFIRE;
        const onTrackToRetirement = projectedRetirementAge <= userProfile.value.targetRetirementAge;

        return {
            currentAge: userProfile.value.currentAge,
            targetRetirementAge: userProfile.value.targetRetirementAge,
            yearsToRetirement: userProfile.value.targetRetirementAge - userProfile.value.currentAge,
            currentNetWorth,
            targetFIRENumber,
            monthlyExpenses: userProfile.value.monthlyExpenses,
            monthlyIncome: userProfile.value.monthlyIncome,
            monthlySavings,
            savingsRate,
            projectedRetirementAge,
            onTrackToRetirement
        };
    });

    // Budget to investment flow tracking
    const budgetToInvestmentFlow = computed<BudgetToInvestmentFlow>(() => {
        const monthlyBudgetSurplus = userProfile.value.monthlyIncome - userProfile.value.monthlyExpenses;
        const emergencyFundTarget = userProfile.value.monthlyExpenses * userProfile.value.emergencyFundMonths;
        const emergencyFundCurrent = goals.value.find(g => g.goalId === '1')?.currentAmount || 0;
        const emergencyFundMonths = userProfile.value.monthlyExpenses > 0 ? 
            emergencyFundCurrent / userProfile.value.monthlyExpenses : 0;
        
        // If emergency fund is complete, allocate more to investments
        const emergencyFundComplete = emergencyFundCurrent >= emergencyFundTarget;
        const emergencyFundContribution = emergencyFundComplete ? 0 : 50000; // $500
        const monthlyInvestmentContribution = monthlyBudgetSurplus - emergencyFundContribution;
        
        const automaticInvestmentRate = monthlyBudgetSurplus > 0 ? 
            (monthlyInvestmentContribution / monthlyBudgetSurplus) * 100 : 0;

        return {
            monthlyBudgetSurplus,
            monthlyInvestmentContribution: Math.max(0, monthlyInvestmentContribution),
            automaticInvestmentRate,
            emergencyFundTarget,
            emergencyFundCurrent,
            emergencyFundMonths
        };
    });

    // Generate retirement projections
    const retirementProjections = computed<RetirementProjection[]>(() => {
        const projections: RetirementProjection[] = [];
        const currentAge = userProfile.value.currentAge;
        const monthlyContribution = budgetToInvestmentFlow.value.monthlyInvestmentContribution;
        const monthlyReturn = userProfile.value.expectedAnnualReturn / 12;
        let portfolioValue = fireMetrics.value.currentNetWorth;
        let cumulativeContributions = portfolioValue;
        
        for (let year = 0; year <= 35; year++) { // Project 35 years out
            const age = currentAge + year;
            
            if (year > 0) {
                // Compound growth calculation
                for (let month = 0; month < 12; month++) {
                    portfolioValue = portfolioValue * (1 + monthlyReturn) + monthlyContribution;
                    cumulativeContributions += monthlyContribution;
                }
            }
            
            const cumulativeGrowth = portfolioValue - cumulativeContributions;
            const monthlyIncome = portfolioValue * (userProfile.value.safeWithdrawalRate / 12);
            
            projections.push({
                year,
                age,
                portfolioValue: Math.round(portfolioValue),
                monthlyIncome: Math.round(monthlyIncome),
                cumulativeContributions: Math.round(cumulativeContributions),
                cumulativeGrowth: Math.round(cumulativeGrowth)
            });
        }
        
        return projections;
    });

    // Helper function to calculate years to reach a goal
    function calculateYearsToGoal(targetAmount: number, monthlyContribution: number, monthlyReturn: number): number {
        if (monthlyContribution <= 0) return Infinity;
        
        // PMT formula rearranged to solve for time
        const numerator = Math.log(1 + (targetAmount * monthlyReturn) / monthlyContribution);
        const denominator = Math.log(1 + monthlyReturn);
        const months = numerator / denominator;
        
        return Math.max(0, months / 12);
    }

    // Update user profile
    function updateUserProfile(updates: Partial<typeof userProfile.value>) {
        Object.assign(userProfile.value, updates);
        updateGoalProgress();
    }

    // Update goal progress
    function updateGoalProgress() {
        goals.value.forEach(goal => {
            goal.progress = goal.targetAmount > 0 ? 
                Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const monthsToGoal = goal.monthlyContribution > 0 ? 
                Math.ceil(remainingAmount / goal.monthlyContribution) : Infinity;
            
            goal.projectedCompletionDate = new Date();
            goal.projectedCompletionDate.setMonth(goal.projectedCompletionDate.getMonth() + monthsToGoal);
            goal.onTrack = goal.projectedCompletionDate <= goal.targetDate;
        });
    }

    // Add new goal
    function addGoal(goalData: Omit<GoalTracker, 'goalId' | 'progress' | 'onTrack' | 'projectedCompletionDate'>) {
        const newGoal: GoalTracker = {
            ...goalData,
            goalId: Date.now().toString(),
            progress: 0,
            onTrack: false,
            projectedCompletionDate: new Date()
        };
        
        goals.value.push(newGoal);
        updateGoalProgress();
    }

    // Update goal
    function updateGoal(goalId: string, updates: Partial<GoalTracker>) {
        const goal = goals.value.find(g => g.goalId === goalId);
        if (goal) {
            Object.assign(goal, updates);
            updateGoalProgress();
        }
    }

    // Get savings optimization suggestions
    const savingsOptimization = computed(() => {
        const suggestions = [];
        const currentSavingsRate = fireMetrics.value.savingsRate;
        
        if (currentSavingsRate < 20) {
            suggestions.push({
                type: 'increase_savings',
                title: 'Increase Savings Rate',
                description: 'Consider increasing your savings rate to at least 20% for better retirement prospects',
                impact: 'High'
            });
        }
        
        if (!budgetToInvestmentFlow.value.emergencyFundTarget) {
            suggestions.push({
                type: 'emergency_fund',
                title: 'Build Emergency Fund',
                description: 'Complete your emergency fund before aggressive investing',
                impact: 'Critical'
            });
        }
        
        const portfolioAllocation = investmentStore.allInvestments;
        const cryptoPercent = portfolioAllocation.filter(inv => 
            ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'].includes(inv.tickerSymbol)
        ).reduce((sum, inv) => sum + inv.currentValue, 0) / fireMetrics.value.currentNetWorth * 100;
        
        if (cryptoPercent > 10) {
            suggestions.push({
                type: 'diversification',
                title: 'Consider Diversification',
                description: 'Crypto allocation is high. Consider more traditional investments for stability',
                impact: 'Medium'
            });
        }
        
        return suggestions;
    });

    // Initialize with current data
    updateGoalProgress();

    return {
        userProfile,
        goals,
        fireMetrics,
        budgetToInvestmentFlow,
        retirementProjections,
        savingsOptimization,
        updateUserProfile,
        updateGoal,
        addGoal,
        calculateYearsToGoal
    };
});