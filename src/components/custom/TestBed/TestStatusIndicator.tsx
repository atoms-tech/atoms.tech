import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Database } from '@/types/base/database.types';

type ExecutionStatus = Database['public']['Enums']['execution_status'];

interface TestStatusIndicatorProps {
    status: ExecutionStatus;
    onStatusChange: (status: ExecutionStatus) => void;
}

const getStatusColor = (status: ExecutionStatus): string => {
    switch (status) {
        case 'passed':
            return 'bg-green-500';
        case 'failed':
            return 'bg-red-500';
        case 'blocked':
            return 'bg-yellow-500';
        case 'in_progress':
            return 'bg-blue-500';
        case 'skipped':
            return 'bg-black';
        default:
            return 'bg-gray-300';
    }
};

export function TestStatusIndicator({
    status,
    onStatusChange,
}: TestStatusIndicatorProps) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="flex items-center justify-center w-5 h-5 min-w-0 min-h-0 border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                    <div
                        className={`w-3.5 h-3.5 rounded-full ${getStatusColor(status)} transition-colors duration-200`}
                    />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="not_executed">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                            <span>Not Executed</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>In Progress</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="passed">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Passed</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="failed">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Failed</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="blocked">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span>Blocked</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="skipped">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-gray-600" />
                            <span>Skipped</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
