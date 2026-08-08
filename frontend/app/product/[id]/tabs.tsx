"use client";

import { Form, Input, InputNumber, Select, Card, Divider, Row, Col,
         Table, Image, Tag, Tooltip, Space } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

// ─── CLOTHING_ATTRS（复用主文件定义） ───────────────────────
const CLOTHING_ATTRS = [
  { key: "Gender",       label: "Gender",          required: true,  opts: ["Women","Men","Girls","Boys","Unisex"] },
  { key: "Season",       label: "Season",           required: true,  opts: ["Spring","Summer","Autumn","Winter","All Seasons"] },
  { key: "Style",        label: "Style",            required: true,  opts: ["Casual","Formal","Elegant","Bohemian","Streetwear","Sports","Vintage","Minimalist","Other"] },
  { key: "Collar",       label: "Collar",           required: true,  opts: ["V-Neck","Round Neck","Turtleneck","Lapel","Square Neck","Off Shoulder","Hooded","Other"] },
  { key: "SleeveLength", label: "Sleeve Length",    required: true,  opts: ["Sleeveless","Short Sleeve","3/4 Sleeve","Long Sleeve","Cap Sleeve"] },
  { key: "SleeveStyle",  label: "Sleeve Style",     required: false, opts: ["Regular","Puff Sleeve","Flare Sleeve","Drop Shoulder"] },
  { key: "FitType",      label: "Fit Type",         required: true,  opts: ["Regular Fit","Slim Fit","Loose Fit","Oversized","Fitted"] },
  { key: "PatternType",  label: "Pattern Type",     required: true,  opts: ["Solid","Striped","Floral","Plaid","Print","Color Block","Other"] },
  { key: "Material",     label: "Material",         required: true,  opts: ["Cotton","Polyester","Linen","Chiffon","Silk","Denim","Knit","Velvet","Satin","Blend","Other"] },
  { key: "Thickness",    label: "Thickness",        required: false, opts: ["Thin","Regular","Thick","Padded"] },
  { key: "Lining",       label: "Lining",           required: false, opts: ["No Lining","Lined","Partially Lined"] },
  { key: "WashCare",     label: "Care Instructions",required: false, opts: ["Machine Wash","Hand Wash","Dry Clean Only"] },
  { key: "Origin",       label: "Item Origin",      required: true,  opts: ["CN (China)"] },
];

const MAIN_IMG_SPECS = [
  { key: "img_main_1", label: "图1 · 正面模特白底",  required: true,  tip: "白底，模特正面，800×1000px" },
  { key: "img_main_2", label: "图2 · 背面模特白底",  required: true,  tip: "白底，模特背面，800×1000px" },
  { key: "img_main_3", label: "图3 · 正背面合并",    required: true,  tip: "白底合并，1600×1000px" },
  { key: "img_main_4", label: "图4 · 场景图1",       required: true,  tip: "户外/街拍场景，3:4" },
  { key: "img_main_5", label: "图5 · 场景图2",       required: false, tip: "室内/生活场景，3:4" },
  { key: "img_main_6", label: "图6 · 细节图1",       required: false, tip: "面料/工艺特写" },
  { key: "img_main_7", label: "图7 · 细节图2",       required: false, tip: "装饰/局部特写" },
  { key: "img_main_8", label: "图8 · 多场景合并",    required: false, tip: "4图拼接，1600×1600px" },
  { key: "img_main_9", label: "图9 · 尺码指引",      required: true,  tip: "尺码对照表，1200×800px" },
];

// ─── Tab①: 基本信息 ─────────────────────────────────────────
export function TabBasic({ product }: { product: any }) {
  return (
    <Card>
      {/* 类目 */}
      <Form.Item label={<><span className="text-red-500">* </span>商品类目 (Category)</>}
        name="category_id">
        <Input placeholder="AI已自动预测类目ID，可手动修改"
          addonBefore={<span className="text-xs text-gray-400">类目ID</span>}
          style={{ width: 320 }} />
      </Form.Item>

      <Divider />

      {/* 标题 */}
      <Form.Item
        label={<><span className="text-red-500">* </span>商品标题 (Product Title) - 最多128字符</>}
        name="title_en"
        rules={[{ required: true, max: 128, message: "标题必填，最多128字符" }]}
        extra={
          <div className="text-xs text-blue-600 mt-1">
            AI公式: <span className="font-mono">核心卖点 + 目标人群 + 产品特征 + 热搜词 + 长尾词</span>
          </div>
        }
      >
        <Input showCount maxLength={128} placeholder="AI已生成英文标题，可修改" size="large" />
      </Form.Item>

      <Form.Item label="中文翻译（仅参考）" name="title_zh">
        <Input disabled className="bg-gray-50 text-gray-500" />
      </Form.Item>

      <Divider />

      {/* 关键词 */}
      <Form.Item
        label={<>商品关键词 (Keywords)
          <Tooltip title="最多5个关键词，提高搜索排名"><InfoCircleOutlined className="ml-1 text-gray-400" /></Tooltip>
        </>}
        name="keywords"
        extra="每行一个，最多5个"
      >
        <TextArea rows={3} placeholder={"women blazer\nlinen jacket\nsummer coat"} />
      </Form.Item>

      <Divider />

      {/* 定价 */}
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item label={<><span className="text-red-500">* </span>商品价格 (Price) USD</>}
            name="price_final"
            rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.01} prefix="$" style={{ width: "100%" }} size="large" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="定价倍率" name="price_multiplier">
            <InputNumber min={1} max={50} step={0.1} style={{ width: "100%" }}
              addonAfter="×" disabled />
          </Form.Item>
        </Col>
        <Col span={8}>
          <div className="mt-6 text-sm text-gray-500">
            1688原价 ¥{product.price_source} × {product.price_multiplier} = ${product.price_final} USD
          </div>
        </Col>
      </Row>

      <Divider />

      {/* 店铺分组 */}
      <Form.Item label="店铺分组 (Store Group)" name="store_group">
        <Input placeholder="选填，用于店铺内分类管理" style={{ width: 320 }} />
      </Form.Item>
    </Card>
  );
}

// ─── Tab②: 商品属性 ─────────────────────────────────────────
export function TabAttrs({ product }: { product: any }) {
  return (
    <Card>
      <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
        以下属性由AI根据1688商品数据自动识别并翻译，请核对后确认。
        <span className="text-red-500 ml-2">* 为必填属性</span>
      </div>
      <Row gutter={[16, 0]}>
        {CLOTHING_ATTRS.map(attr => (
          <Col span={8} key={attr.key}>
            <Form.Item
              label={<>{attr.required && <span className="text-red-500">* </span>}{attr.label}</>}
              name={attr.key}
              rules={attr.required ? [{ required: true, message: `${attr.label} is required` }] : []}
            >
              <Select placeholder={`Select ${attr.label}`} allowClear>
                {attr.opts.map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">自定义属性</Divider>
      <Form.Item label="Additional Attributes" name="custom_attrs"
        extra="如有其他属性，格式：属性名:属性值，每行一个">
        <TextArea rows={3} placeholder={"Closure Type: Button\nLength: Long\nOccasion: Office"} />
      </Form.Item>
    </Card>
  );
}

// ─── Tab③: 商品图片 ─────────────────────────────────────────
export function TabImages({ product }: { product: any }) {
  return (
    <Card>
      {/* 主图区（6张上传速卖通） */}
      <Divider orientation="left">
        <span className="text-red-500">* </span>主图 (Main Images)
        <span className="text-gray-400 text-xs ml-2">最多6张，第一张为封面主图，按序选择</span>
      </Divider>
      <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4 text-sm text-orange-700">
        以下9张图由AI自动生成，<strong>前6张</strong>将作为速卖通主图上传（按1→6顺序）。可拖拽调整顺序。
      </div>

      {/* 9张主图预览 */}
      <div className="flex flex-wrap gap-4 mb-6">
        {MAIN_IMG_SPECS.map((spec, i) => {
          const url = product[spec.key];
          return (
            <div key={spec.key} className="flex flex-col items-center">
              <div className="relative">
                {i < 6 && (
                  <div className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-red-500 text-white
                                  rounded-full text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                )}
                <div className={`w-[120px] h-[120px] border-2 rounded overflow-hidden
                                 flex items-center justify-center bg-gray-50
                                 ${url ? "border-green-400" : "border-dashed border-gray-300"}`}>
                  {url
                    ? <Image src={url} width={120} height={120} style={{ objectFit: "cover" }} alt={spec.label} />
                    : <div className="text-gray-300 text-xs text-center p-2">AI生成中...</div>}
                </div>
              </div>
              <div className="text-xs text-center mt-1 w-[120px] leading-tight text-gray-600">
                {spec.required && <span className="text-red-500">* </span>}
                {spec.label}
                <Tooltip title={spec.tip}><InfoCircleOutlined className="ml-1 text-gray-400" /></Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {/* 白底主图 + 3:4场景图 */}
      <Divider orientation="left">附加图片</Divider>
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <div className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded overflow-hidden
                          flex items-center justify-center bg-gray-50">
            {product.img_white_1_1
              ? <Image src={product.img_white_1_1} width={120} height={120} style={{ objectFit: "cover" }} alt="" />
              : <div className="text-gray-300 text-xs text-center p-2">AI生成中...</div>}
          </div>
          <div className="text-xs text-center mt-1 text-gray-600">1:1 白底主图<br/><span className="text-gray-400">亚马逊/1688封面用</span></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[90px] h-[120px] border-2 border-dashed border-gray-300 rounded overflow-hidden
                          flex items-center justify-center bg-gray-50">
            {product.img_scene_3_4
              ? <Image src={product.img_scene_3_4} width={90} height={120} style={{ objectFit: "cover" }} alt="" />
              : <div className="text-gray-300 text-xs text-center p-2">AI生成中...</div>}
          </div>
          <div className="text-xs text-center mt-1 text-gray-600">3:4 竖版场景图<br/><span className="text-gray-400">AI生成</span></div>
        </div>
      </div>

      {/* SKU颜色图 */}
      <Divider orientation="left">规格图 (SKU Images) · 颜色</Divider>
      <div className="flex flex-wrap gap-3">
        {(product.sku_data || [])
          .filter((s: any) => s.image)
          .slice(0, 10)
          .map((sku: any, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-[80px] h-[80px] border border-gray-200 rounded overflow-hidden">
              <Image src={sku.image} width={80} height={80} style={{ objectFit: "cover" }} alt="" />
            </div>
            <div className="text-xs mt-1 text-gray-500">
              {Object.values(sku.spec_en || sku.spec || {})[0] as string || "-"}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Tab④: SKU规格 ──────────────────────────────────────────
export function TabSKU({ product }: { product: any }) {
  const skus = product.sku_data || [];
  const columns = [
    { title: "规格（中文）", key: "spec_zh", width: 160,
      render: (_: any, r: any) =>
        Object.entries(r.spec || {}).map(([k, v]) => `${k}: ${v}`).join(" / ") },
    { title: "规格（英文）", key: "spec_en",
      render: (_: any, r: any) =>
        Object.entries(r.spec_en || {}).map(([k, v]) => `${k}: ${v}`).join(" / ") },
    { title: "图片", key: "img", width: 70,
      render: (_: any, r: any) => r.image
        ? <Image src={r.image} width={50} height={50} style={{ objectFit: "cover" }} alt="" />
        : <div className="w-12 h-12 bg-gray-100 rounded" /> },
    { title: "1688价格", dataIndex: "price", key: "price", width: 100,
      render: (v: number) => `¥${v}` },
    { title: "速卖通售价 (USD)", key: "sale_price", width: 140,
      render: (_: any, r: any) =>
        `$${((r.price || 0) * (product.price_multiplier || 3)).toFixed(2)}` },
    { title: "库存", dataIndex: "stock", key: "stock", width: 80 },
    { title: "SKU ID", key: "sku_id", width: 100,
      render: (_: any, r: any) => <span className="text-xs text-gray-400">{r.sku_id}</span> },
  ];

  // 颜色/尺码汇总
  const colors = [...new Set(skus.map((s: any) =>
    (s.spec_en || s.spec || {})["Color"] || (s.spec || {})["颜色"] || ""))].filter(Boolean);
  const sizes = [...new Set(skus.map((s: any) =>
    (s.spec_en || s.spec || {})["Size"] || (s.spec || {})["尺码"] || ""))].filter(Boolean);

  return (
    <Card>
      <div className="flex gap-6 mb-4 p-3 bg-gray-50 rounded">
        <div>
          <span className="text-xs text-gray-500">颜色数量</span>
          <div className="font-bold text-lg">{colors.length}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {colors.map((c: any) => <Tag key={c} color="blue">{c}</Tag>)}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">尺码数量</span>
          <div className="font-bold text-lg">{sizes.length}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {sizes.map((s: any) => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">SKU总数</span>
          <div className="font-bold text-lg">{skus.length}</div>
        </div>
      </div>

      <Table dataSource={skus} columns={columns} rowKey={(r: any, i: any) => i}
        pagination={false} size="small" scroll={{ x: 800 }} />
    </Card>
  );
}

// ─── Tab⑤: 商品详情 ─────────────────────────────────────────
export function TabDesc({ product }: { product: any }) {
  return (
    <Card>
      {/* AI卖点 */}
      <Divider orientation="left">AI生成卖点 (Bullet Points)</Divider>
      <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
        {(product.bullet_points || []).length > 0
          ? (product.bullet_points || []).map((b: string, i: number) => (
              <div key={i} className="text-sm text-gray-700 mb-2 flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>{b}</span>
              </div>
            ))
          : <span className="text-gray-400 text-sm">AI处理中，稍后显示...</span>}
      </div>

      {/* 英文描述 */}
      <Form.Item
        label={<><span className="text-red-500">* </span>产品描述 (Product Description · English)</>}
        name="description_en"
      >
        <Input.TextArea rows={14} placeholder="AI已生成英文描述（含产品特征/洗护说明/尺码建议），可修改" />
      </Form.Item>

      {/* 中文翻译参考 */}
      <Divider orientation="left">中文翻译（参考，不上传）</Divider>
      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-600 max-h-60 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-sans leading-relaxed">
          {product.description_zh || "AI处理中..."}
        </pre>
      </div>

      {/* 详情图（10张） */}
      <Divider orientation="left">详情图 (Detail Images · 10张)</Divider>
      <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4 text-sm text-orange-700">
        AI已生成10张详情图，每张800×800px，包含产品概述/面料/细节/尺码/场景等。
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 10 }, (_, i) => {
          const url = product[`img_detail_${i + 1}`];
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-[110px] h-[110px] border-2 rounded overflow-hidden
                               flex items-center justify-center bg-gray-50
                               ${url ? "border-green-400" : "border-dashed border-gray-300"}`}>
                {url
                  ? <Image src={url} width={110} height={110} style={{ objectFit: "cover" }} alt={`detail-${i+1}`} />
                  : <div className="text-gray-300 text-xs text-center p-2">AI生成中...</div>}
              </div>
              <div className="text-xs mt-1 text-gray-500">详情图 {i + 1}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Tab⑥: 物流信息 ─────────────────────────────────────────
export function TabLogistics() {
  return (
    <Card>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item
            label={<><span className="text-red-500">* </span>物流模板 (Logistics Template)</>}
            name="logistics_template"
          >
            <Select placeholder="选择物流模板">
              <Option value="aliexpress_standard">AliExpress Standard Shipping</Option>
              <Option value="aliexpress_premium">AliExpress Premium Shipping</Option>
              <Option value="cainiao_standard">Cainiao Super Economy</Option>
              <Option value="yanwen">Yanwen Express</Option>
              <Option value="yunexpress">Yun Express</Option>
              <Option value="other">Other / Free Shipping</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="处理时间 (Processing Time)" name="processing_time">
            <Select>
              {["1","2","3","4","5","6","7"].map(d =>
                <Option key={d} value={d}>{d} Days</Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">包裹尺寸与重量</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item label={<><span className="text-red-500">* </span>重量 (Weight) g</>}
            name="package_weight" rules={[{ required: true }]}>
            <InputNumber min={1} max={50000} style={{ width: "100%" }} addonAfter="g" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="长 (Length) cm" name="package_length">
            <InputNumber min={1} style={{ width: "100%" }} addonAfter="cm" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="宽 (Width) cm" name="package_width">
            <InputNumber min={1} style={{ width: "100%" }} addonAfter="cm" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="高 (Height) cm" name="package_height">
            <InputNumber min={1} style={{ width: "100%" }} addonAfter="cm" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">发货信息</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="发货地 (Ship From)" name="ship_from">
            <Select defaultValue="CN">
              <Option value="CN">China (CN)</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="不发货地区 (No Delivery To)" name="no_delivery_area">
            <Select mode="multiple" placeholder="通常留空">
              <Option value="RU">Russia</Option>
              <Option value="BR">Brazil</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}

// ─── Tab⑦: 售后服务 ─────────────────────────────────────────
export function TabAfterSale() {
  return (
    <Card>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item
            label={<><span className="text-red-500">* </span>退货政策 (Return Policy)</>}
            name="return_policy"
          >
            <Select>
              <Option value="15">15 Days Return</Option>
              <Option value="30">30 Days Return</Option>
              <Option value="60">60 Days Return</Option>
              <Option value="90">90 Days Return</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="保修期 (Warranty)" name="warranty">
            <Select>
              <Option value="none">No Warranty</Option>
              <Option value="1month">1 Month Warranty</Option>
              <Option value="3months">3 Months Warranty</Option>
              <Option value="6months">6 Months Warranty</Option>
              <Option value="1year">1 Year Warranty</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item label="服务承诺 (Service Promise)" name="service_promise">
            <Select mode="multiple" placeholder="可多选">
              <Option value="on_time_delivery">On-Time Delivery</Option>
              <Option value="buyer_protection">Buyer Protection</Option>
              <Option value="refund_guarantee">Refund Guarantee</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="适用国家 (Ship To)" name="ship_to">
            <Select mode="multiple" placeholder="留空=全球发货">
              <Option value="US">United States</Option>
              <Option value="UK">United Kingdom</Option>
              <Option value="DE">Germany</Option>
              <Option value="FR">France</Option>
              <Option value="AU">Australia</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <div className="mt-4 p-4 bg-gray-50 rounded text-sm text-gray-500">
        <strong>提示：</strong>速卖通要求所有商品必须支持买家保护（Buyer Protection）。
        退货政策建议选择30天，有助于提高转化率。
      </div>
    </Card>
  );
}
