import AlertDropdown from "@/alerts/alertDropDown";
import { DelIcon } from "@/components/bs-icons/del";
import { LoadIcon } from "@/components/bs-icons/loading";
import { SaveIcon } from "@/components/bs-icons/save";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { Button } from "@/components/bs-ui/button";
import ActionButton from "@/components/bs-ui/button/actionButton";
import TextInput from "@/components/bs-ui/input/textInput";
import { RadioGroup, RadioGroupItem } from "@/components/bs-ui/radio";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { alertContext } from "@/contexts/alertContext";
import { PopUpContext } from "@/contexts/popUpContext";
import { TabsContext } from "@/contexts/tabsContext";
import TipPng from "../../../assets/tip.png";
import { undoRedoContext } from "@/contexts/undoRedoContext";
import ApiModal from "@/modals/ApiModal";
import L2ParamsModal from "@/modals/L2ParamsModal";
import ExportModal from "@/modals/exportModal";
import { ArrowDownIcon, ArrowUpIcon, BellIcon, CodeIcon, ExitIcon, LayersIcon, StackIcon } from "@radix-ui/react-icons";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createFlowVersion, deleteVersion, getFlowVersions, getVersionDetails, updateVersion } from "@/controllers/API/flow";
import { FlowVersionItem } from "@/types/flow";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";

export default function Header({ flow }) {
    const navgate = useNavigate()
    const { t } = useTranslation()
    const { message } = useToast()
    const [open, setOpen] = useState(false)
    const AlertWidth = 384;
    const { notificationCenter, setNotificationCenter } = useContext(alertContext);
    const { uploadFlow, setFlow, tabsState, saveFlow } = useContext(TabsContext);
    const isPending = tabsState[flow.id]?.isPending;
    const { openPopUp } = useContext(PopUpContext);
    // 记录快照
    const { takeSnapshot } = useContext(undoRedoContext);

    const handleSaveNewVersion = async () => {
        // 累加版本 vx ++
        let maxNo = 1
        versions.forEach(v => {
            const match = v.name.match(/[vV](\d+)/)
            maxNo = match ? Math.max(Number(match[1]), maxNo) : maxNo
        })
        maxNo++
        // save
        const res = await captureAndAlertRequestErrorHoc(
            createFlowVersion(flow.id, { name: `v${maxNo}`, description: '', data: flow.data })
        )
        message({
            variant: "success",
            title: `版本 v${maxNo} 保存成功`,
            description: ""
        })
        // 更新版本列表
        refrenshVersions()
    }

    // 版本管理
    const [loading, setLoading] = useState(false)
    const { versions, version, changeName, deleteVersion, refrenshVersions, setCurrentVersion } = useVersion(flow)
    // 切换版本
    const handleChangeVersion = async (versionId) => {
        setLoading(true)
        // 保存当前版本
        await saveFlow(flow)
        // 切换版本UI
        const currentVersion = setCurrentVersion(Number(versionId))
        // 加载选中版本data
        const res = await getVersionDetails(versionId)
        // 自动触发 page的 clone flow
        setFlow('versionChange', { ...flow, data: res.data })
        message({
            variant: "success",
            title: `切换到 ${currentVersion.name}`,
            description: ""
        })
        setLoading(false)
    }

    return <div className="flex justify-between items-center border-b px-4">
        {
            loading && <div className=" fixed left-0 top-0 w-full h-screen bg-gray-50/60 z-50 flex items-center justify-center">
                <LoadIcon className="mr-2 text-gray-600" />
                <span>切换到 {version.name}</span>
            </div>
        }
        <div className="flex items-center gap-2 py-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => navgate('/build/skill/' + flow.id, { replace: true })}
            ><ExitIcon className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => { takeSnapshot(); uploadFlow() }} >
                <ArrowUpIcon className="h-4 w-4 mr-1" />导入
            </Button>
            <Button variant="outline" onClick={() => { openPopUp(<ExportModal />) }}>
                <ArrowDownIcon className="h-4 w-4 mr-1" />导出
            </Button>
            <Button variant="outline" onClick={() => { openPopUp(<ApiModal flow={flow} />) }} >
                <CodeIcon className="h-4 w-4 mr-1" />代码
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)} >
                <StackIcon className="h-4 w-4 mr-1" />简化
            </Button>
        </div>
        {
            version && <div className="flex gap-4">
                <Button className="px-6 flex gap-2" type="button" onClick={() =>
                    updateVersion(version.id, { name: version.name, description: '', data: flow.data }).then(_ =>
                        _ && message({
                            variant: "success",
                            title: t('success'),
                            description: ""
                        }))
                }
                    disabled={!isPending}><SaveIcon />保存</Button>
                <ActionButton
                    className="px-6 flex gap-2"
                    align="end"
                    onClick={handleSaveNewVersion}
                    buttonTipContent={(
                        <div>
                            <img src={TipPng} alt="" className="w-80" />
                            <p className="mt-4 text-sm">支持分成多个版本分支，分别进行开发以及版本间的比较。</p>
                        </div>
                    )}
                    dropDown={(
                        <div>
                            <RadioGroup value={version.id + ''} onValueChange={handleChangeVersion} className="gap-0">
                                {versions.map((vers, index) => (
                                    <div key={vers.id} className="group flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-gray-100 border-b">
                                        <RadioGroupItem value={vers.id + ''} />
                                        <div className="w-52">
                                            <TextInput
                                                className="h-[30px]"
                                                type="hover"
                                                value={vers.name}
                                                maxLength={30}
                                                onSave={val => changeName(vers.id, val)}
                                            ></TextInput>
                                            <p className="text-sm text-muted-foreground mt-2">{vers.update_time.replace('T', ' ')}</p>
                                        </div>
                                        {
                                            // 最后一个 V0 版本和当前选中版本不允许删除
                                            !(version.id === vers.id || versions.length - 1 === index)
                                            && <Button
                                                className="group-hover:block hidden"
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                onClick={() => deleteVersion(vers, index)}
                                            ><DelIcon /></Button>
                                        }

                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                ><LayersIcon />保存版本</ActionButton>
                <Button variant="outline" className="relative"
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                        setNotificationCenter(false);
                        const { top, left } = (event.target as Element).getBoundingClientRect();
                        openPopUp(
                            <>
                                <div className="absolute z-10" style={{ top: top + 40, left: left - AlertWidth }} ><AlertDropdown /></div>
                                <div className="header-notifications-box"></div>
                            </>
                        );
                    }}
                >
                    <BellIcon className="h-4 w-4" />
                    {notificationCenter && <div className="header-notifications"></div>}
                </Button>
            </div>
        }

        {/* 高级配置l2配置 */}
        <L2ParamsModal data={flow} open={open} setOpen={setOpen} onSave={() => {
            saveFlow(flow);
            message({
                variant: "success",
                title: t('success'),
                description: ""
            });
        }}></L2ParamsModal>
    </div>
};

// 技能版本管理
const useVersion = (flow) => {
    const [versions, setVersions] = useState<FlowVersionItem[]>([])
    const { version, setVersion } = useContext(TabsContext)

    const refrenshVersions = () => {
        getFlowVersions(flow.id).then(res => {
            setVersions(res)
            const currentV = res.find(el => el.is_current === 1)
            setVersion(currentV)
        })
    }

    useEffect(() => {
        refrenshVersions()
    }, [])

    // 修改名字
    const handleChangName = (id, name) => {
        captureAndAlertRequestErrorHoc(updateVersion(id, { name, description: '', data: null }))
        // 乐观更新
        setVersions(versions.map(version => {
            if (version.id === id) {
                version.name = name;
            }
            return version;
        }))
    }

    const handleDeleteVersion = (version, index) => {
        bsConfirm({
            title: "提示",
            desc: `是否删除 ${version.name} 版本？`,
            onOk: (next) => {
                captureAndAlertRequestErrorHoc(deleteVersion(version.id)).then(res => {
                    if (res) {
                        // 乐观更新
                        setVersions(versions.filter((_, i) => i !== index))
                    }
                })
                next()
            }
        })
    }

    return {
        versions,
        version,
        setCurrentVersion(versionId) {
            const currentV = versions.find(el => el.id === versionId)
            setVersion(currentV)
            return currentV
        },
        refrenshVersions,
        deleteVersion: handleDeleteVersion,
        changeName: handleChangName,
    }
}
