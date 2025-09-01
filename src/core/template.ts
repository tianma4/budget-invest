import type { TypeAndName } from './base.ts';

export class TemplateType implements TypeAndName {
    private static readonly allInstances: TemplateType[] = [];
    private static readonly allInstancesByType: Record<number, TemplateType> = {};

    public static readonly Normal = new TemplateType(1, 'Normal');
    public static readonly Schedule = new TemplateType(2, 'Schedule');

    public readonly type: number;
    public readonly name: string;

    private constructor(type: number, name: string) {
        this.type = type;
        this.name = name;

        TemplateType.allInstances.push(this);
        TemplateType.allInstancesByType[type] = this;
    }

    public static values(): TemplateType[] {
        return TemplateType.allInstances;
    }

    public static valueOf(type: number): TemplateType | undefined {
        return TemplateType.allInstancesByType[type];
    }
}

export class ScheduledTemplateFrequencyType implements TypeAndName {
    private static readonly allInstances: ScheduledTemplateFrequencyType[] = [];
    private static readonly allInstancesByType: Record<number, ScheduledTemplateFrequencyType> = {};

    public static readonly Disabled = new ScheduledTemplateFrequencyType(0, 'Disabled');
    public static readonly Weekly = new ScheduledTemplateFrequencyType(1, 'Weekly');
    public static readonly Monthly = new ScheduledTemplateFrequencyType(2, 'Monthly');

    public readonly type: number;
    public readonly name: string;

    private constructor(type: number, name: string) {
        this.type = type;
        this.name = name;

        ScheduledTemplateFrequencyType.allInstances.push(this);
        ScheduledTemplateFrequencyType.allInstancesByType[type] = this;
    }

    public static values(): ScheduledTemplateFrequencyType[] {
        return ScheduledTemplateFrequencyType.allInstances;
    }

    public static valueOf(type: number): ScheduledTemplateFrequencyType | undefined {
        return ScheduledTemplateFrequencyType.allInstancesByType[type];
    }
}
