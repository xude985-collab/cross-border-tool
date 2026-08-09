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
    <Card>
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">
          <span className="text-red-500">* </span>发货地
        </div>
        <Select defaultValue="CN" style={{ width: 300 }}>
          <Option value="CN">中国大陆</Option>
        </Select>
      </div>

      <Divider />

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">
          <span className="text-red-500">* </span>运费模版
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <Radio.Group defaultValue="free">
            <Space direction="vertical">
              <Radio value="free">
                <span className="font-medium">包邮（Free Shipping）</span>
                <div className="text-xs text-gray-400 ml-6">卖家承担运费，买家免费收货</div>
              </Radio>
              <Radio value="template">
                <span className="font-medium">使用运费模版</span>
                <div className="text-xs text-gray-400 ml-6">按地区/重量设置不同运费</div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>

      <Divider />

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">备货时间</div>
        <Select defaultValue="3" style={{ width: 200 }}>
          {[1,2,3,5,7,10,15].map(d =>
            <Option key={d} value={String(d)}>{d} 天</Option>
          )}
        </Select>
        <div className="text-xs text-gray-400 mt-1">订单付款后到发货的准备时间</div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 2: 基本信息（类目 + 标题 + 属性 + 图片 + SKU）
// ═══════════════════════════════════════════════════════════
function TabBasicInfo({ product }: { product: any }) {
  return (
    <div className="space-y-4">
      {/* ─── 类目 ─── */}
      <Card size="small" title={<><span className="text-red-500">* </span>商品类目</>}>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-orange-50 border border-orange-200 rounded px-3 py-2 text-sm">
            <span className="text-orange-600 font-medium">Women&apos;s Clothing</span>
            <span className="text-gray-400 mx-2">&gt;</span>
            <span>Dresses</span>
            <span className="text-gray-400 mx-2">&gt;</span>
            <span>Casual Dresses</span>
          </div>
          <Button size="small" type="link">修改类目</Button>
        </div>
      </Card>

      {/* ─── 商品标题 ─── */}
      <Card size="small" title={<><span className="text-red-500">* </span>商品标题</>}>
        <Form.Item name="title_en" noStyle
          rules={[{ required: true, max: 128, message: "标题必填，最多128字符" }]}>
          <Input
            showCount
            maxLength={128}
            size="large"
            placeholder="请输入商品标题（英文），最多128个字符"
            suffix={<Tooltip title="标题公式：核心卖点+目标人群+产品特征+热搜词"><QuestionCircleOutlined /></Tooltip>}
          />
        </Form.Item>
        <div className="mt-2 text-xs text-gray-400">
          建议格式：核心卖点 + 适用人群 + 产品类型 + 热搜关键词
        </div>
      </Card>

      {/* ─── 商品属性 ─── */}
      <Card size="small" title={<><span className="text-red-500">* </span>商品属性</>}>
        <Row gutter={[16, 12]}>
          {[
            { key: "Brand Name", label: "品牌", required: true, opts: ["No Brand", "OEM", "Other"] },
            { key: "Material", label: "材质", required: true, opts: ["Cotton","Polyester","Linen","Chiffon","Silk","Blend","Other"] },
            { key: "Style", label: "风格", required: true, opts: ["Casual","Formal","Bohemian","Streetwear","Vintage","Elegant","Other"] },
            { key: "Silhouette", label: "廓形", required: true, opts: ["A-Line","Bodycon","Shift","Wrap","Fit and Flare","Other"] },
            { key: "Pattern Type", label: "图案", required: true, opts: ["Solid","Floral","Striped","Plaid","Print","Leopard","Other"] },
            { key: "Sleeve Length", label: "袖长", required: true, opts: ["Sleeveless","Short Sleeve","Half Sleeve","Long Sleeve"] },
            { key: "Neckline", label: "领型", required: true, opts: ["V-Neck","Round Neck","Square Neck","Off Shoulder","Turtleneck","Other"] },
            { key: "Decoration", label: "装饰", required: false, opts: ["Lace","Button","Bow","Sequins","Embroidery","None"] },
            { key: "Dresses Length", label: "裙长", required: true, opts: ["Mini","Knee-Length","Mid-Calf","Ankle-Length","Floor-Length"] },
            { key: "Waistline", label: "腰型", required: false, opts: ["Natural","Empire","Dropped","No Waistline"] },
            { key: "Season", label: "季节", required: true, opts: ["Spring","Summer","Autumn","Winter","All Season"] },
            { key: "Age Group", label: "年龄", required: false, opts: ["18-24","25-34","35-44","45+"] },
          ].map(attr => (
            <Col span={8} key={attr.key}>
              <Form.Item
                label={<span className="text-xs">{attr.required && <span className="text-red-500">* </span>}{attr.label} ({attr.key})</span>}
                name={["attrs", attr.key]}
                className="mb-0"
              >
                <Select size="small" placeholder={`选择${attr.label}`} allowClear>
                  {attr.opts.map(o => <Option key={o} value={o}>{o}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>

      {/* ─── 商品主图 ─── */}
      <Card size="small" title={
        <div className="flex items-center justify-between w-full">
          <span><span className="text-red-500">* </span>商品图片</span>
          <span className="text-xs text-gray-400 font-normal">最多上传6张，第一张为主图，建议800×800以上正方形白底图</span>
        </div>
      }>
        <div className="flex gap-3 flex-wrap">
          {[1,2,3,4,5,6].map(i => {
            const url = product[`img_main_${i}`];
            return (
              <div key={i} className="relative group">
                <div className={`w-[120px] h-[120px] border-2 rounded flex items-center justify-center
                  ${i === 1 ? "border-orange-400" : url ? "border-green-400" : "border-dashed border-gray-300"}
                  bg-gray-50 overflow-hidden`}>
                  {url
                    ? <Image src={url} width={120} height={120} style={{ objectFit: "cover" }} alt="" />
                    : <div className="text-center text-gray-300">
                        <PlusOutlined className="text-2xl mb-1 block" />
                        <span className="text-xs">上传图片</span>
                      </div>}
                </div>
                {i === 1 && <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs px-1 rounded-br">主图</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── SKU信息 ─── */}
      <Card size="small" title={<><span className="text-red-500">* </span>销售规格 (SKU)</>}>
        {/* 颜色 */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <span>颜色 (Color)</span>
            <Tag color="blue">{[...new Set((product.sku_data || []).map((s: any) => (s.spec_en || s.spec || {})["Color"] || ""))].filter(Boolean).length} 个</Tag>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set((product.sku_data || []).map((s: any) => (s.spec_en || s.spec || {})["Color"] || ""))].filter(Boolean).map((c: any) => (
              <div key={c} className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 尺码 */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <span>尺码 (Size)</span>
            <Tag>{[...new Set((product.sku_data || []).map((s: any) => (s.spec_en || s.spec || {})["Size"] || ""))].filter(Boolean).length} 个</Tag>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set((product.sku_data || []).map((s: any) => (s.spec_en || s.spec || {})["Size"] || ""))].filter(Boolean).map((s: any) => (
              <div key={s} className="border border-gray-200 rounded px-3 py-1 text-sm bg-white">{s}</div>
            ))}
          </div>
        </div>

        {/* SKU价格表格 */}
        <Table
          size="small"
          pagination={false}
          scroll={{ x: 700 }}
          dataSource={product.sku_data || []}
          rowKey={(_: any, i: any) => i}
          columns={[
            { title: "颜色", key: "color", width: 100,
              render: (_: any, r: any) => (r.spec_en || r.spec || {})["Color"] || "-" },
            { title: "尺码", key: "size", width: 80,
              render: (_: any, r: any) => (r.spec_en || r.spec || {})["Size"] || "-" },
            { title: "SKU图", key: "img", width: 60,
              render: (_: any, r: any) => r.image
                ? <Image src={r.image} width={40} height={40} style={{ objectFit: "cover" }} alt="" />
                : <div className="w-10 h-10 bg-gray-100 rounded" /> },
            { title: "价格 (USD)", key: "price", width: 120,
              render: (_: any, r: any) => (
                <InputNumber size="small" min={0.01} step={0.01} prefix="$"
                  defaultValue={((r.price || 0) * (product.price_multiplier || 3)).toFixed(2)}
                  style={{ width: 100 }} />
              )},
            { title: "库存", dataIndex: "stock", key: "stock", width: 80,
              render: (v: number) => <InputNumber size="small" min={0} defaultValue={v || 999} style={{ width: 70 }} /> },
            { title: "SKU编码", key: "sku_id", width: 120,
              render: (_: any, r: any) => <Input size="small" defaultValue={r.sku_id || ""} placeholder="可选" /> },
          ]}
        />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 3: 供货价
// ═══════════════════════════════════════════════════════════
function TabPrice({ product }: { product: any }) {
  return (
    <Card>
      <div className="mb-6">
        <div className="text-sm font-medium mb-3">定价方式</div>
        <Radio.Group defaultValue="unified">
          <Radio value="unified">统一售价</Radio>
          <Radio value="sku">按SKU分别定价</Radio>
        </Radio.Group>
      </div>

      <Divider />

      <Row gutter={24}>
        <Col span={8}>
          <Form.Item label={<><span className="text-red-500">* </span>商品售价 (USD)</>} name="price_final">
            <InputNumber min={0.01} step={0.01} prefix="$" style={{ width: "100%" }} size="large" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="划线价 / 原价 (USD)" name="price_original">
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: "100%" }}
              placeholder="可选，显示折扣" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <div className="mt-8 p-3 bg-blue-50 rounded text-sm">
            <div className="text-gray-500">1688进货价</div>
            <div className="text-lg font-bold">¥{product.price_source || "—"}</div>
            <div className="text-xs text-gray-400">× {product.price_multiplier || 3} 倍率 = ${product.price_final || "—"}</div>
          </div>
        </Col>
      </Row>

      <Divider />

      <div>
        <div className="text-sm font-medium mb-2">批发价 / 阶梯价（可选）</div>
        <div className="text-xs text-gray-400 mb-3">设置购买数量越多价格越低，吸引批发买家</div>
        <Table size="small" pagination={false}
          dataSource={[
            { qty: "1-4件", price: product.price_final || "—" },
            { qty: "5-9件", discount: "5%", price: ((product.price_final || 0) * 0.95).toFixed(2) },
            { qty: "10+件", discount: "10%", price: ((product.price_final || 0) * 0.9).toFixed(2) },
          ]}
          columns={[
            { title: "购买数量", dataIndex: "qty" },
            { title: "折扣", dataIndex: "discount", render: (v: any) => v || "原价" },
            { title: "单价 (USD)", dataIndex: "price", render: (v: any) => `$${v}` },
          ]}
        />
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 4: 详细描述
// ═══════════════════════════════════════════════════════════
function TabDescription({ product }: { product: any }) {
  return (
    <div className="space-y-4">
      {/* 商品描述 */}
      <Card size="small" title="商品描述（Description）">
        <Form.Item name="description_en" noStyle>
          <TextArea rows={12} placeholder="AI自动生成的英文商品描述..." />
        </Form.Item>
        <div className="mt-2 text-xs text-gray-400">
          支持HTML格式。AI已根据商品特征自动生成描述，可手动编辑。
        </div>
      </Card>

      {/* 详情图 */}
      <Card size="small" title={
        <div className="flex items-center justify-between w-full">
          <span>详情图片</span>
          <span className="text-xs text-gray-400 font-normal">AI生成10张详情图，展示产品卖点</span>
        </div>
      }>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 10 }, (_, i) => {
            const url = product[`img_detail_${i + 1}`];
            return (
              <div key={i} className="relative">
                <div className={`w-[100px] h-[100px] border rounded overflow-hidden
                  ${url ? "border-green-400" : "border-dashed border-gray-300"}
                  flex items-center justify-center bg-gray-50`}>
                  {url
                    ? <Image src={url} width={100} height={100} style={{ objectFit: "cover" }} alt="" />
                    : <div className="text-gray-300 text-xs text-center">
                        <PlusOutlined className="block mb-1" />
                        详情图{i+1}
                      </div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 尺码图 */}
      <Card size="small" title="尺码对照表">
        <div className="w-[200px] h-[140px] border border-dashed border-gray-300 rounded
                        flex items-center justify-center bg-gray-50">
          {product.img_main_9
            ? <Image src={product.img_main_9} width={200} height={140} style={{ objectFit: "contain" }} alt="" />
            : <span className="text-gray-300 text-xs">AI生成尺码图</span>}
        </div>
      </Card>
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
