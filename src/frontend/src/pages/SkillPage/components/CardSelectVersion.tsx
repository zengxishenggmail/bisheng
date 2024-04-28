import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/bs-ui/tooltip";
import { changeCurrentVersion } from "@/controllers/API/flow";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";
import { useState } from "react";

const SelectComp = ({ value, onChange = (id) => { }, data, disabled = false }) => {

    const handleChange = (id) => {
        captureAndAlertRequestErrorHoc(changeCurrentVersion({ flow_id: data.id, version_id: Number(id) }))
        onChange(id)
    }

    return <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-[120px] h-6">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {
                data.version_list.length ?
                    data.version_list.map(version => (
                        <SelectItem value={version.id}>{version.name}</SelectItem>
                    ))
                    : <SelectItem value={'0'}>v0</SelectItem>
            }
        </SelectContent>
    </Select>
}

export default function CardSelectVersion(
    { showPop, ...props }:
        { showPop: boolean, data: any }
) {
    const [value, setValue] = useState(props.data.version_list.find(item => item.is_current === 1)?.id || '0')

    if (showPop) return <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                <SelectComp {...props} value={value} onChange={setValue} />
            </TooltipTrigger>
            <TooltipContent>
                <p>选择上线版本</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>


    return <SelectComp {...props} value={value} disabled={!showPop} />
};
