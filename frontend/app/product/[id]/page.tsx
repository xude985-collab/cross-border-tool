"use client";
import { useState, useEffect, use } from "react";
import {
  Form, Input, InputNumber, Button, Card, Tabs, Tag, Image,
  Row, Col, Divider, message, Select, Table, Upload, Radio,
  Space, Tooltip, Badge, Progress, Checkbox, Switch,
} from "antd";
import {
  InfoCircleOutlined, PlusOutlined, UploadOutlined,
  CheckCircleOutlined, WarningOutlined, QuestionCircleOutlined,
  DeleteOutlined, EditOutlined,
} from "@ant-design/icons";
import { getProduct, updateProduct, batchUpload } from "@/lib/api";
import { useRouter } from "next/navigation";

const { TextArea } = Input;
const { Option } = Select;

export default function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    getProduct(Number(id)).then(p => {
      setProduct(p);
      form.setFieldsValue(p);
    }).catch(() => {
      // demo数据用于展示
      setProduct({ id, title_en: "", status: "draft" });
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const vals = form.getFieldsValue();
      await updateProduct(Number(id), vals);
      message.success("保存成功");
    } catch { message.error("保存失败"); }
    finally { setSaving(false); }
  };

  if (!product) return <div className="flex items-center justify-center h-screen text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ═══ 顶部操作栏（仿速卖通） ═══ */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()}>← 返回</Button>
          <span className="text-base font-medium text-gray-800">编辑商品</span>
          <Tag color={product.status === "ready" ? "green" : product.status === "uploaded" ? "blue" : "orange"}>
            {product.status === "ready" ? "待发布" : product.status === "uploaded" ? "已发布" : "草稿"}
          </Tag>
        </div>
        <Space>
          <Button onClick={handleSave} loading={saving}>保存草稿</Button>
          <Button type="primary" style={{ background: "#ff6a00" }}>提交发布</Button>
        </Space>
      </div>

      {/* ═══ 主内容 ═══ */}
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={16}>
            {/* ─── 左侧主表单 ─── */}
            <Col span={18}>
              <Tabs
                type="card"
                defaultActiveKey="shipping"
                items={[
                  { key: "shipping", label: "发货地与运费模版", children: <TabShipping /> },
                  { key: "basic", label: "基本信息", children: <TabBasicInfo product={product} /> },
                  { key: "price", label: "供货价", children: <TabPrice product={product} /> },
                  { key: "desc", label: "详细描述", children: <TabDescription product={product} /> },
                  { key: "other", label: "其它设置", children: <TabOther /> },
                ]}
              />
            </Col>

            {/* ─── 右侧信息完整度面板 ─── */}
            <Col span={6}>
              <Card size="small" title="商品信息完整度优化" className="sticky top-16">
                <Progress percent={75} strokeColor="#ff6a00" className="mb-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <span>商品标题</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <span>商品类目</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <span>商品图片 (6/6)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WarningOutlined className="text-orange-500" />
                    <span>商品属性（缺少2项）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <span>SKU规格</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <WarningOutlined className="text-orange-500" />
                    <span>详细描述</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <span>发货与运费</span>
                  </div>
                </div>
                <Divider className="my-3" />
                <div className="text-xs text-gray-400">
                  完善以上信息可提升商品搜索排名和转化率
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 1: 发货地与运费模版
// ═══════════════════════════════════════════════════════════
function TabShipping() {
  return (
    <div className="space-y-4">
      {/* 顶部橙色提示 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="text-base font-medium">
          设置指定「发货地」及「目的地」可解锁 <span className="text-orange-500">「平台权益」</span>
        </div>
        <div className="text-xs text-orange-400 mt-1">
          解锁平台权益有机会获得「Local+专属氛围」「独享爆品场景」「全域流量加持」
        </div>
      </div>

      {/* 步骤条 */}
      <div className="flex items-center gap-2 text-sm py-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-orange-500">发布商品设置发货地</span>
        </div>
        <div className="w-16 h-px bg-gray-300" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-orange-500">运费模板设置目的地</span>
        </div>
        <div className="w-16 h-px bg-gray-300" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-orange-500">报名本地链</span>
        </div>
      </div>

      {/* 发货地 */}
      <Card size="small">
        <div className="mb-2">
          <span className="text-red-500">* </span>
          <span className="font-medium">发货地</span>
          <span className="text-xs text-gray-400 ml-2">选择多个发货国的情况下，平台会按顺序先发布第一个国家的商品，其他国家商品再陆续发布。注：每个国家将单独一个商品链接。</span>
        </div>

        {/* VAT提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-3 text-xs text-blue-600">
          <InfoCircleOutlined className="mr-1" />
          加拿大(CA)，智利(CL)，捷克，波兰(PL)，英国(UK)，德国(DE)，西班牙(ES)，法国(FR)，意大利(IT)由于暂未开通VAT资质因此无法选择。
          <a className="text-orange-500 ml-1">开通VAT资质</a>
        </div>

        {/* 国家复选框 */}
        <Form.Item name="ship_from" initialValue={["US"]}>
          <Checkbox.Group>
            <Row gutter={[24, 12]}>
              <Col span={6}><Checkbox value="JP">日本(JP)</Checkbox></Col>
              <Col span={6}><Checkbox value="IL">以色列(IL)</Checkbox></Col>
              <Col span={6}><Checkbox value="US">美国(US)</Checkbox></Col>
              <Col span={6}><Checkbox value="AU">澳大利亚(AU)</Checkbox></Col>
              <Col span={6}><Checkbox value="MX">墨西哥(MX)</Checkbox></Col>
              <Col span={6}><Checkbox value="KR">韩国(KR)</Checkbox></Col>
              <Col span={6}><Checkbox value="SA">沙特阿拉伯(SA)</Checkbox></Col>
              <Col span={6}><Checkbox value="TR">土耳其(TR)</Checkbox></Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      {/* 运费模板 */}
      <Card size="small">
        <div className="mb-2">
          <span className="text-red-500">* </span>
          <span className="font-medium">运费模板</span>
          <span className="text-xs text-gray-400 ml-2">运费模板会决定可达国家，不同发货地的部分可达国家可获平台权益。</span>
          <a className="text-blue-500 text-xs ml-1">管理运费模板</a>
        </div>

        {/* 按国家的Tab */}
        <Tabs
          size="small"
          defaultActiveKey="US"
          items={[
            { key: "US", label: <><span className="text-red-500">*</span>美国(US) <CheckCircleOutlined className="text-green-500" /></>,
              children: (
                <div>
                  {/* 蓝色提示 */}
                  <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-3 text-xs text-blue-600">
                    <InfoCircleOutlined className="mr-1" />
                    为持续提升美国市场消费者的物流体验与服务保障，平台将对官方配送线路能力可承运的商品，在消费者端默认推荐官方配送服务。
                  </div>

                  {/* 运费模板选择 */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-red-500">*</span>
                    <span className="text-sm">美国(US)运费模板</span>
                    <Select defaultValue="us_official" style={{ width: 300 }}>
                      <Option value="us_official">美区物流（含官方）(Location: US)</Option>
                      <Option value="us_standard">Standard Shipping (US)</Option>
                      <Option value="us_free">Free Shipping (US)</Option>
                    </Select>
                    <Button size="small" type="link">新建运费模板</Button>
                  </div>

                  {/* 可达区域 */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                    <div className="text-gray-500 mb-1">以下为该模板可达区域，共 1 个可达区域：</div>
                    <div className="text-gray-500">可达区域：</div>
                    <Tag className="mt-1">美国(US)</Tag>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 2: 基本信息（完全仿照速卖通）
// ═══════════════════════════════════════════════════════════
function TabBasicInfo({ product }: { product: any }) {
  return (
    <div className="space-y-6">
      {/* ─── 商品图片 ─── */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-red-500">*</span>
          <span className="font-medium">商品图片</span>
          <Tooltip title="图片横纵比例支持1:1（像素≥800*800）或3:4（像素≥750*1000），支持jpg、jpeg、png格式">
            <QuestionCircleOutlined className="text-gray-400" />
          </Tooltip>
        </div>

        {/* 8个图片格子 */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex gap-3">
            {["商品正面图","商品背面图","商品实拍图","商品侧面图","商品细节图","商品细节图","商品细节图","商品细节图"].map((label, i) => {
              const url = product[`img_main_${i + 1}`];
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-xs text-white bg-[#666] px-2 py-0.5 rounded-t min-w-[90px] text-center">
                    {label}
                  </div>
                  <div className={`w-[90px] h-[90px] border border-dashed border-gray-300 rounded-b
                    flex flex-col items-center justify-center bg-white cursor-pointer hover:border-blue-400
                    ${url ? "border-solid border-green-400" : ""}`}>
                    {url
                      ? <Image src={url} width={90} height={90} style={{ objectFit: "cover" }} alt="" preview={true} />
                      : <>
                          <PlusOutlined className="text-blue-500 text-lg" />
                          <span className="text-xs text-gray-400 mt-1">添加图片</span>
                        </>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI图片翻译按钮 */}
          <div className="mt-3">
            <Button size="small" className="border-blue-400 text-blue-500">
              <span className="bg-blue-500 text-white text-xs px-1 rounded mr-1">Ai</span>
              图片翻译
            </Button>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            图片横纵比例支持1:1（像素≥800*800）或3:4（像素≥750*1000），支持jpg、jpeg、png格式；
          </div>
        </div>
      </div>

      {/* ─── 分国家上传 ─── */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="text-sm text-gray-500 mb-3">
          支持分国家上传商品图片，如未上传，则在前台默认展示通用商品图片。
        </div>

        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm font-medium">美国</span>
          {["商品正面图","商品背面图","商品实拍图","商品侧面图","商品细节图","商品细节图","商品细节图","商品细节图"].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-xs text-white bg-[#666] px-1.5 py-0.5 rounded-t min-w-[80px] text-center text-[10px]">
                {label}
              </div>
              <div className="w-[80px] h-[70px] border border-dashed border-gray-300 rounded-b
                flex flex-col items-center justify-center bg-white cursor-pointer hover:border-blue-400">
                <PlusOutlined className="text-blue-500" />
                <span className="text-[10px] text-gray-400 mt-0.5">添加图片</span>
              </div>
            </div>
          ))}
          <a className="text-blue-500 text-xs whitespace-nowrap ml-auto">复制商品图片</a>
        </div>
      </div>

      {/* ─── 发布语言 ─── */}
      <div className="flex items-center gap-3">
        <span className="text-red-500">*</span>
        <span className="font-medium">发布语言</span>
        <Tooltip title="选择商品面向买家展示的语言"><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
        <Select defaultValue="en" style={{ width: 200 }}>
          <Option value="en">英文</Option>
          <Option value="pt">葡萄牙语</Option>
          <Option value="es">西班牙语</Option>
          <Option value="fr">法语</Option>
          <Option value="ru">俄语</Option>
        </Select>
      </div>

      {/* ─── 商品标题 ─── */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-red-500">*</span>
          <span className="font-medium">商品标题</span>
          <Tooltip title="建议格式：核心卖点+适用人群+产品类型+热搜关键词">
            <QuestionCircleOutlined className="text-gray-400" />
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Form.Item name="title_en" noStyle>
            <Input
              showCount
              maxLength={255}
              size="large"
              placeholder="请输入商品标题"
              style={{ flex: 1 }}
            />
          </Form.Item>
          <Button type="link">翻译</Button>
        </div>
        <div className="mt-2">
          <Button size="small" className="border-blue-400 text-blue-500">
            <span className="bg-blue-500 text-white text-xs px-1 rounded mr-1">Ai</span>
            标题生成
          </Button>
        </div>
      </div>

      {/* ─── 类目 ─── */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-red-500">*</span>
          <span className="font-medium">类目</span>
        </div>
        <div className="flex items-center gap-2">
          <Form.Item name="category_path" noStyle>
            <Input
              size="large"
              placeholder="请选择或搜索类目"
              style={{ width: 500 }}
              suffix={<span className="text-gray-400 cursor-pointer">🔍</span>}
              allowClear
            />
          </Form.Item>
        </div>
        <div className="mt-2">
          <Button size="small" className="border-blue-400 text-blue-500">
            <span className="bg-blue-500 text-white text-xs px-1 rounded mr-1">Ai</span>
            类目查询
          </Button>
        </div>
      </div>

      {/* ─── 营销图 ─── */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-red-500">*</span>
          <span className="font-medium">营销图</span>
          <span className="text-xs text-blue-500 ml-2">在营销导购场景，优质的商品图片（1:1白底图、3:4场景图）对导购转化有正向效果。</span>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex gap-4">
            {/* 1:1 白底图 */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-white bg-[#666] px-2 py-0.5 rounded-t w-[120px] text-center">1:1白底图</div>
              <div className={`w-[120px] h-[120px] border border-dashed border-gray-300 rounded-b
                flex flex-col items-center justify-center bg-white cursor-pointer hover:border-blue-400
                ${product.img_white_1_1 ? "border-solid border-green-400" : ""}`}>
                {product.img_white_1_1
                  ? <Image src={product.img_white_1_1} width={120} height={120} style={{ objectFit: "cover" }} alt="" />
                  : <>
                      <PlusOutlined className="text-blue-500 text-lg" />
                      <span className="text-xs text-gray-400">添加图片</span>
                    </>}
              </div>
            </div>
            {/* 3:4 场景图 */}
            <div className="flex flex-col items-center">
              <div className="text-xs text-white bg-orange-500 px-2 py-0.5 rounded-t w-[90px] text-center">3:4场景图</div>
              <div className={`w-[90px] h-[120px] border border-dashed border-gray-300 rounded-b
                flex flex-col items-center justify-center bg-white cursor-pointer hover:border-blue-400
                ${product.img_scene_3_4 ? "border-solid border-green-400" : ""}`}>
                {product.img_scene_3_4
                  ? <Image src={product.img_scene_3_4} width={90} height={120} style={{ objectFit: "cover" }} alt="" />
                  : <>
                      <PlusOutlined className="text-blue-500 text-lg" />
                      <span className="text-xs text-gray-400">添加图片</span>
                    </>}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button size="small" className="border-blue-400 text-blue-500">
              <span className="bg-blue-500 text-white text-xs px-1 rounded mr-1">Ai</span>
              图片优化
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 商品视频 ─── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-medium">商品视频</span>
          <Button size="small" icon={<UploadOutlined />}>上传视频</Button>
        </div>
        <div className="text-xs text-orange-400">
          请及时补充商品视频，同时需保证上传视频与商品信息一致性，如存在视频质量不符无法认定任务完成。建议视频比例为1:1或者16:9，视频时长在30秒内，视频大小在2GB内。
        </div>
        {/* 分国家视频 */}
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm">美国</span>
            <Button size="small" icon={<UploadOutlined />}>上传视频</Button>
          </div>
        </div>
      </div>

      {/* ─── 商品属性 ─── */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-red-500">*</span>
          <span className="font-medium">商品属性</span>
          <Tooltip title="根据类目自动展示对应属性"><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <Row gutter={[48, 20]}>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">品牌</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="no_brand">No Brand</Option>
                  <Option value="oem">OEM</Option>
                  <Option value="other">Other</Option>
                </Select>
              </div>
              <div className="text-xs text-blue-500 ml-[120px] mt-1 cursor-pointer">找不到品牌？<span className="text-orange-500">在这里申请新品牌!</span></div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">高关注化学品</span>
                <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
                <Button size="small">设置</Button>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">产地（国家或地区）</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="CN">中国</Option>
                  <Option value="US">美国</Option>
                  <Option value="JP">日本</Option>
                  <Option value="KR">韩国</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="text-red-500">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">材质</span>
                <Input placeholder="请输入或从列表选择" style={{ flex: 1 }} />
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">型号</span>
                <Input placeholder="请输入" style={{ flex: 1 }} />
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">新奇特产品</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="yes">是</Option>
                  <Option value="no">否</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">类型</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="dress">连衣裙(Dress)</Option>
                  <Option value="blouse">衬衫(Blouse)</Option>
                  <Option value="t-shirt">T恤(T-Shirt)</Option>
                  <Option value="pants">裤子(Pants)</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">用途</span>
                <Input placeholder="请输入或从列表选择" style={{ flex: 1 }} />
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">风格</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="casual">Casual</Option>
                  <Option value="formal">Formal</Option>
                  <Option value="bohemian">Bohemian</Option>
                  <Option value="streetwear">Streetwear</Option>
                  <Option value="vintage">Vintage</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">图案</span>
                <Input placeholder="请输入或从列表选择" style={{ flex: 1 }} />
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">袖长</span>
                <Select placeholder="请选择" style={{ flex: 1 }} allowClear>
                  <Option value="sleeveless">无袖</Option>
                  <Option value="short">短袖</Option>
                  <Option value="half">中袖</Option>
                  <Option value="long">长袖</Option>
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div className="flex items-center gap-3">
                <span className="invisible">*</span>
                <span className="text-sm text-gray-600 w-[100px] text-right shrink-0">领型</span>
                <Input placeholder="请输入或从列表选择" style={{ flex: 1 }} />
              </div>
            </Col>
          </Row>

          {/* 添加自定义属性 */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-orange-500 text-sm cursor-pointer">添加自定义属性</span>
            <Button size="small" type="dashed" icon={<PlusOutlined />}>添加自定义属性</Button>
            <span className="text-xs text-gray-400">属性总数最多 100 组</span>
          </div>
        </div>
      </div>

      {/* ─── 商品使用说明书 ─── */}
      <div className="flex items-center gap-3">
        <span className="font-medium">商品使用说明书</span>
        <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
        <Button size="small" icon={<UploadOutlined />}>上传文件</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 3: 供货价（仿速卖通）
// ═══════════════════════════════════════════════════════════
function TabPrice({ product }: { product: any }) {
  return (
    <div className="space-y-6">
      <div className="text-xl font-medium">供货价</div>

      {/* 最小计量单元 */}
      <div className="flex items-center gap-4">
        <span className="text-red-500">*</span>
        <span className="text-sm text-gray-700 w-[100px]">最小计量单元</span>
        <Select defaultValue="piece" style={{ width: 280 }}>
          <Option value="piece">件/个 (piece/pieces)</Option>
          <Option value="set">套 (set/sets)</Option>
          <Option value="pair">双 (pair/pairs)</Option>
          <Option value="lot">批 (lot/lots)</Option>
        </Select>
      </div>

      {/* 销售方式 */}
      <div className="flex items-center gap-4">
        <span className="text-red-500">*</span>
        <span className="text-sm text-gray-700 w-[100px]">销售方式</span>
        <Select defaultValue="by_piece" style={{ width: 280 }}>
          <Option value="by_piece">按 件 出售</Option>
          <Option value="by_lot">按 批 出售</Option>
        </Select>
      </div>

      {/* 销售属性 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700 ml-6 w-[100px]">销售属性</span>
        <Button type="primary" style={{ background: "#1677ff" }}>
          添加属性（0/2）
        </Button>
      </div>

      {/* 分目的国/地区设置 */}
      <div className="flex items-center gap-2 ml-6">
        <span className="text-sm text-orange-500">分目的国/地区设置</span>
        <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
        <Checkbox>支持</Checkbox>
      </div>
      <div className="ml-[130px] text-sm text-gray-500">含邮供货价</div>

      {/* 查看重量和尺寸测量规范示例 */}
      <div className="ml-6">
        <a className="text-blue-500 text-sm">查看重量和尺寸测量规范示例</a>
      </div>

      {/* 批量填充按钮 */}
      <div className="flex justify-end">
        <Button>批量填充</Button>
      </div>

      {/* SKU价格表格 */}
      <div className="overflow-x-auto">
        <Table
          size="small"
          pagination={false}
          bordered
          scroll={{ x: 1200 }}
          dataSource={[{ key: 1, country: "美国(US)" }]}
          columns={[
            { title: "发货地", dataIndex: "country", key: "country", width: 100, fixed: "left" },
            { title: <><span className="text-red-500">*</span> 货值+物流费=含邮供货价(CNY) <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "price_cny", width: 250,
              render: () => (
                <div className="text-sm">
                  <div className="text-gray-500">全球/其他</div>
                  <div>货值 - | 物流费 - | 含邮供货价 -</div>
                  <a className="text-orange-500">设置货值与物流费</a>
                </div>
              )},
            { title: <><span className="text-red-500">*</span> 库存</>, key: "stock", width: 100,
              render: () => <InputNumber size="small" min={0} style={{ width: 80 }} /> },
            { title: <>SKU编码 <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "sku", width: 140,
              render: () => <Input size="small" placeholder="" suffix={<span className="text-xs text-gray-400">0/50</span>} /> },
            { title: <><span className="text-red-500">*</span> 重量 (kg) <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "weight", width: 120,
              render: () => <InputNumber size="small" min={0} step={0.01} style={{ width: 100 }} /> },
            { title: <><span className="text-red-500">*</span> 尺寸 (cm) <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "size", width: 220,
              render: () => (
                <Space size={4}>
                  <InputNumber size="small" placeholder="长" style={{ width: 55 }} />
                  <span>*</span>
                  <InputNumber size="small" placeholder="宽" style={{ width: 55 }} />
                  <span>*</span>
                  <InputNumber size="small" placeholder="高" style={{ width: 55 }} />
                </Space>
              )},
            { title: <>特殊商品类型 <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "special_type", width: 130,
              render: () => <Select size="small" defaultValue="normal" style={{ width: 100 }}>
                <Option value="normal">普货</Option>
                <Option value="sensitive">敏感货</Option>
                <Option value="battery">含电池</Option>
              </Select> },
            { title: <>是否销售 <Tooltip title=""><QuestionCircleOutlined className="text-gray-400 text-xs" /></Tooltip></>,
              key: "on_sale", width: 100,
              render: () => <Switch defaultChecked checkedChildren="是" unCheckedChildren="否" /> },
          ]}
        />
      </div>

      {/* 底部提示 */}
      <div className="text-sm">
        <span className="text-gray-500">总库存: </span>
        <span className="text-orange-500 font-medium">0</span>
        <span className="text-gray-500 ml-4">为确保新品孵化成功，平台将在</span>
        <span className="text-red-500">新发品72h内限制所有SKU库存下调</span>
        <span className="text-gray-500">，请谨慎填写</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 4: 详细描述（仿速卖通）
// ═══════════════════════════════════════════════════════════
function TabDescription({ product }: { product: any }) {
  return (
    <div className="space-y-6">
      {/* 子Tab */}
      <div className="border-b border-gray-200">
        <div className="text-blue-600 font-medium pb-2 border-b-2 border-blue-600 inline-block">
          发布语言(英语)
        </div>
      </div>

      {/* 详描语言 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">详描语言</span>
        <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
        <Select defaultValue="en" style={{ width: 200 }}>
          <Option value="en">英语(发布语言)</Option>
          <Option value="pt">葡萄牙语</Option>
          <Option value="es">西班牙语</Option>
          <Option value="fr">法语</Option>
        </Select>
      </div>

      {/* PC详描编辑 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-red-500">*</span>
          <span className="font-medium">PC详描编辑</span>
          <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
          <Button size="small" style={{ color: "#d4380d", borderColor: "#d4380d" }}>导入无线详情描述</Button>
          <Button size="small">预览</Button>
          <Button size="small" className="border-blue-400 text-blue-500">
            <span className="bg-blue-500 text-white text-xs px-1 rounded mr-1">Ai</span>
            卖点生成
          </Button>
        </div>

        {/* 富文本编辑器 */}
        <div className="border border-gray-300 rounded">
          {/* 工具栏第一行 */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white">
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded font-bold text-sm">B</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded italic text-sm">I</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded underline text-sm">U</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded line-through text-sm">S</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-sm">A</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-sm">🎨</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">≡</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">≡</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">≡</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">≡</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⋮≡</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⋮≡</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⇤</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⇥</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⇥</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">🧹</button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">↩</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">↪</button>
          </div>

          {/* 工具栏第二行 */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-white">
            <Select size="small" defaultValue="body" style={{ width: 70 }} bordered={false}>
              <Option value="body">正文</Option>
              <Option value="h1">标题1</Option>
              <Option value="h2">标题2</Option>
              <Option value="h3">标题3</Option>
            </Select>
            <Select size="small" defaultValue="default" style={{ width: 90 }} bordered={false}>
              <Option value="default">默认字体</Option>
              <Option value="arial">Arial</Option>
              <Option value="times">Times</Option>
            </Select>
            <Select size="small" defaultValue="default" style={{ width: 90 }} bordered={false}>
              <Option value="default">默认字号</Option>
              <Option value="12">12px</Option>
              <Option value="14">14px</Option>
              <Option value="16">16px</Option>
              <Option value="18">18px</Option>
            </Select>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">🔗</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">🖼</button>
            <div className="relative">
              <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">📱</button>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-0.5 rounded">NEW</span>
            </div>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-xs">⛶</button>
          </div>

          {/* 编辑区域 */}
          <Form.Item name="description_en" noStyle>
            <TextArea
              rows={16}
              bordered={false}
              style={{ background: "#f5f5f0", resize: "none", minHeight: 350 }}
              placeholder="在此编辑商品详细描述...（AI已自动生成，可手动修改）"
            />
          </Form.Item>
        </div>
      </div>

      {/* APP详描编辑 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="font-medium text-gray-700">APP详描编辑</span>
          <Tooltip title=""><QuestionCircleOutlined className="text-gray-400" /></Tooltip>
          <Button size="small" style={{ color: "#d4380d", borderColor: "#d4380d" }}>导入PC详描</Button>
          <span className="text-sm text-gray-400">若未进行APP详描编辑，将自动同步PC详描</span>
        </div>

        {/* 模板卡片 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex gap-6">
            {/* 空白模板 */}
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
              <div className="w-[140px] h-[180px] border border-dashed border-gray-300 rounded
                flex flex-col items-center justify-center bg-white">
                <div className="text-4xl text-gray-300 mb-2">📄</div>
              </div>
              <span className="text-sm text-gray-600 mt-2">空白模板</span>
            </div>

            {/* 通用详描模板 */}
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
              <div className="w-[140px] h-[180px] border border-gray-300 rounded overflow-hidden bg-white">
                <div className="p-2">
                  <div className="text-[9px] text-gray-400">Item Description</div>
                  <div className="text-[10px] font-bold text-orange-600 mt-1">Selling Point</div>
                  <div className="text-[8px] text-gray-400 leading-tight mt-0.5">
                    Describe the details of the selling point or service, persuading them to your potential...
                  </div>
                </div>
                <div className="bg-gray-200 h-[80px] mx-2 rounded flex items-center justify-center">
                  <span className="text-[9px] text-gray-400">许要添加样图</span>
                </div>
              </div>
              <span className="text-sm text-gray-600 mt-2">通用详描模板</span>
            </div>

            {/* 查看更多 */}
            <div className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80">
              <div className="w-[140px] h-[180px] border border-dashed border-gray-300 rounded
                flex flex-col items-center justify-center bg-white">
                <a className="text-blue-500 text-sm text-center">查看更多<br/>详描模板</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 5: 其它设置
// ═══════════════════════════════════════════════════════════
function TabOther() {
  return (
    <Card>
      <Row gutter={[24, 16]}>
        <Col span={12}>
          <Form.Item label="商品分组" name="product_group">
            <Select placeholder="选择店铺分组" allowClear>
              <Option value="new">新品上架</Option>
              <Option value="hot">热销</Option>
              <Option value="clearance">清仓</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="服务承诺" name="service_promise">
            <Select mode="multiple" placeholder="可多选">
              <Option value="on_time_delivery">准时发货</Option>
              <Option value="buyer_protection">买家保障</Option>
              <Option value="refund_guarantee">退款保障</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="退货政策" name="return_policy">
            <Select defaultValue="15">
              <Option value="no">不支持退货</Option>
              <Option value="15">15天退货</Option>
              <Option value="30">30天退货</Option>
              <Option value="60">60天退货</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="商品单位" name="product_unit">
            <Select defaultValue="piece">
              <Option value="piece">件 (Piece)</Option>
              <Option value="set">套 (Set)</Option>
              <Option value="pair">双 (Pair)</Option>
              <Option value="lot">批 (Lot)</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">自定义货号</span>
          <Input placeholder="可选，你的内部编号" style={{ width: 300 }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">打包重量（g）</span>
          <InputNumber min={1} defaultValue={300} addonAfter="g" style={{ width: 160 }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">包装尺寸（cm）</span>
          <Space>
            <InputNumber min={1} defaultValue={30} placeholder="长" style={{ width: 80 }} />
            <span>×</span>
            <InputNumber min={1} defaultValue={20} placeholder="宽" style={{ width: 80 }} />
            <span>×</span>
            <InputNumber min={1} defaultValue={5} placeholder="高" style={{ width: 80 }} />
          </Space>
        </div>
      </div>
    </Card>
  );
}
