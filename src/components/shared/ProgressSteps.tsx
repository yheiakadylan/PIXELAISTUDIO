import React from 'react';

interface Step {
    number: number;
    label: string;
    status: 'pending' | 'active' | 'completed';
}

interface ProgressStepsProps {
    steps: Step[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps }) => {
    return (
        <div className="nes-container is-dark shadow-hard mb-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                        {/* Step */}
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`
                  w-12 h-12 border-4 flex items-center justify-center font-bold
                  ${step.status === 'completed' ? 'border-nes-green bg-nes-green text-black' : ''}
                  ${step.status === 'active' ? 'border-nes-blue bg-nes-blue text-white' : ''}
                  ${step.status === 'pending' ? 'border-nes-gray bg-transparent text-nes-gray' : ''}
                `}
                            >
                                {step.status === 'completed' ? '✓' : step.number}
                            </div>
                            <span
                                className={`
                  text-xs mt-2 text-center
                  ${step.status === 'active' ? 'text-nes-blue' : ''}
                  ${step.status === 'completed' ? 'text-nes-green' : ''}
                  ${step.status === 'pending' ? 'text-nes-gray' : ''}
                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector */}
                        {index < steps.length - 1 && (
                            <div
                                className={`
                  h-1 flex-1 mx-2
                  ${steps[index + 1].status !== 'pending' ? 'bg-nes-green' : 'bg-nes-gray'}
                `}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default ProgressSteps;
