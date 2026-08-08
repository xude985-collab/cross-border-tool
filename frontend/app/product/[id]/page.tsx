"use client";
import { useState, useEffect, use } from "react";
import {
  Form, Input, InputNumber, Button, Card, Tabs, Tag, Image,
  Row, Col, Divider, message, Select, Table, Upload, Radio,
  Space, Tooltip, Badge, Popover,
} from "antd";
import {
  InfoCircleOutlined, PlusOutlined, UploadOutlined,
  CheckCircleOutlined, WarningOutlined,
} from "@ant-design/icons";
import { getProduct, updateProduct, batchUpload } from "@/lib/api";
import { useRouter } from "next/navigation";

const { TextArea } = Input;
const { Option } = Select;

// ─── 速卖通类目属性（服装品类） ─────────────────────────────
const CLOTHING_ATTRS = [
  { key: "Gender",        label: "Gender",         required: true,  opts: ["Women","Men","Girls","Boys","Unisex"] },
  { key: "Season",        label: "Season",          required: true,  opts: ["Spring","Summer","Autumn","Winter","All Seasons"] },
  { key: "Style",         label: "Style",           required: true,  opts: ["Casual","Formal","Elegant","Bohemian","Streetwear","Sports","Vintage","Minimalist","Other"] },
  { key: "Collar",        label: "Collar",          required: true,  opts: ["V-Neck","Round Neck","Turtleneck","Lapel","Square Neck","Off Shoulder","Cowl Neck","Hooded","Other"] },
  { key: "SleeveLength",  label: "Sleeve Length",   required: true,  opts: ["Sleeveless","Short Sleeve","3/4 Sleeve","Long Sleeve","Cap Sleeve"] },
  { key: "SleeveStyle",   label: "Sleeve Style",    required: false, opts: ["Regular","Puff Sleeve","Flare Sleeve","Roll-up Sleeve","Drop Shoulder"] },
  { key: "FitType",       label: "Fit Type",        required: true,  opts: ["Regular Fit","Slim Fit","Loose Fit","Oversized","Fitted"] },
  { key: "PatternType",   label: "Pattern Type",    required: true,  opts: ["Solid","Striped","Floral","Plaid","Print","Color Block","Leopard","Tie Dye","Other"] },
  { key: "Material",      label: "Material",        required: true,  opts: ["Cotton","Polyester","Linen","Chiffon","Silk","Denim","Knit","Velvet","Satin","Blend","Other"] },
  { key: "Thickness",     label: "Thickness",       required: false, opts: ["Thin","Regular","Thick","Padded"] },
  { key: "Lining",        label: "Lining",          required: false, opts: ["No Lining","Lined","Partially Lined"] },
  { key: "WashCare",      label: "Care Instructions",required: false, opts: ["Machine Wash","Hand Wash","Dry Clean Only","Do Not Wash"] },
  { key: "Origin",        label: "Item Origin",     required: true,  opts: ["CN (China)"] },
];

// ─── 主图说明（9张规格）──────────────────────────────────────
const MAIN_IMG_SPECS = [
  { key: "img_main_1", label: "图1 · 正面模特白底",  required: true,  tip: "白底，模特正面，800×1000px" },
  { key: "img_main_2", label: "图2 · 背面模特白底",  required: true,  tip: "白底，模特背面，800×1000px" },
  { key: "img_main_3", label: "图3 · 正背面合并",    required: true,  tip: "白底，正面+背面拼接，1600×1000px" },
  { key: "img_main_4", label: "图4 · 场景图1",       required: true,  tip: "户外/街拍场景，3:4竖版" },
  { key: "img_main_5", label: "图5 · 场景图2",       required: false, tip: "室内/咖啡厅场景，3:4竖版" },
  { key: "img_main_6", label: "图6 · 细节图1",       required: false, tip: "面料/工艺特写，800×800px" },
  { key: "img_main_7", label: "图7 · 细节图2",       required: false, tip: "装饰/局部特写，800×800px" },
  { key: "img_main_8", label: "图8 · 多场景合并",    required: false, tip: "4张场景拼接，1600×1600px" },
  { key: "img_main_9", label: "图9 · 尺码指引图",    required: true,  tip: "尺码对照表，1200×800px" },
];

// ─── 详情图说明（10张）──────────────────────────────────────
const DETAIL_IMG_SPECS = Array.from({ length: 10 }, (_, i) => ({
  key: `img_detail_${i + 1}`,
  label: `详情图 ${i + 1}`,
}));

import { TabBasic, TabAttrs, TabImages, TabSKU, TabDesc, TabLogistics, TabAfterSale } from "./tabs";

// ─── 图片预览组件 ────────────────────────────────────────────
function ImgCell({ url, label, tip, required }: {
  url?: string; label: string; tip?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[110px] h-[110px] border border-dashed border-gray-300 rounded
                      flex items-center justify-center bg-gray-50 overflow-hidden">
        {url
          ? <Image src={url} width={110} height={110} style={{ objectFit: "cover" }} alt={label} />
          : <div className="text-gray-300 text-xs text-center px-1">AI 生成中...</div>}
        {url && <CheckCircleOutlined className="absolute top-1 right-1 text-green-500 text-sm" />}
      </div>
      <div className="text-xs text-center text-gray-600 w-[110px] leading-tight">
        {required && <span className="text-red-500">*</span>} {label}
        {tip && <Tooltip title={tip}><InfoCircleOutlined className="ml-1 text-gray-400" /></Tooltip>}
      </div>
    </div>
  );
}

// ─── 主编辑器组件 ────────────────────────────────────────────
export default function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    getProduct(Number(id)).then(p => {
      setProduct(p);
      form.setFieldsValue({
        title_en: p.title_en,
        title_zh: p.title_zh,
        description_en: p.description_en,
        price_final: p.price_final,
        category_id: p.category_id,
        // 属性
        ...(p.aliexpress_attrs || {}),
        // 物流
        package_weight: p.package_weight || 300,
        package_length: p.package_length || 30,
        package_width: p.package_width || 20,
        package_height: p.package_height || 5,
        processing_time: p.processing_time || "3",
        // 售后
        return_policy: p.return_policy || "30",
        warranty: p.warranty || "No Warranty",
      });
    });
  }, [id]);

  const handleSave = async () => {
    const vals = form.getFieldsValue();
    setSaving(true);
    try {
      await updateProduct(Number(id), vals);
      message.success("保存成功");
    } catch { message.error("保存失败"); }
    finally { setSaving(false); }
  };

  const handleUpload = async () => {
    await handleSave();
    setUploading(true);
    try {
      const res = await batchUpload([Number(id)]);
      if (res.success?.length > 0) {
        message.success("上传成功！速卖通商品ID: " + res.success[0].aliexpress_id);
        router.back();
      } else {
        message.error("上传失败: " + (res.failed?.[0]?.reason || "未知错误"));
      }
    } finally { setUploading(false); }
  };

  if (!product) return <div className="flex items-center justify-center h-screen text-gray-400">加载中...</div>;

  const isReady = product.status === "ready";
  const isUploaded = product.status === "uploaded";

  // ─── 渲染 ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ── 顶部栏（仿速卖通橙红色导航）─────────────────── */}
      <div className="sticky top-0 z-50 bg-[#e62e04] text-white px-6 py-0 flex items-center justify-between shadow-md" style={{ height: 48 }}>
        <div className="flex items-center gap-4">
          <span className="font-bold text-base tracking-wide">AliExpress · Seller Center</span>
          <span className="text-sm text-red-200">/</span>
          <span className="text-sm text-red-100">发布商品</span>
          <Badge
            status={isUploaded ? "success" : isReady ? "processing" : "default"}
            text={<span className="text-white text-xs">{
              isUploaded ? "已发布" : isReady ? "待发布" : "处理中"
            }</span>}
          />
        </div>
        <Space>
          <Button size="small" onClick={() => router.back()}>← 返回</Button>
          <Button size="small" onClick={handleSave} loading={saving}>保存草稿</Button>
          <Button
            size="small" type="primary"
            style={{ background: isReady ? "#ff6900" : "#999", border: "none" }}
            onClick={handleUpload}
            loading={uploading}
            disabled={!isReady}
          >
            {isUploaded ? "已上传到速卖通" : "发布到速卖通"}
          </Button>
        </Space>
      </div>

      {/* ── 1688原始信息提示条 ──────────────────────────── */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-sm text-blue-700">
        <span className="font-medium">1688原标题：</span>{product.original_title_zh}
        <span className="mx-4 text-blue-300">|</span>
        <span className="font-medium">1688价格：</span>¥{product.price_source}
        <span className="mx-2 text-blue-300">×</span>{product.price_multiplier}
        <span className="mx-2 text-blue-300">=</span>
        <span className="font-bold text-blue-800">${product.price_final} USD</span>
        <span className="mx-4 text-blue-300">|</span>
        <span className="font-medium">AI处理状态：</span>
        <Tag color={isReady ? "green" : isUploaded ? "blue" : "orange"}>
          {product.status}
        </Tag>
      </div>

      {/* ── 主内容区 ────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <Form form={form} layout="vertical" requiredMark="optional">
          <Tabs
            type="card"
            defaultActiveKey="basic"
            items={[
              { key: "basic",     label: "① 基本信息",   children: <TabBasic product={product} /> },
              { key: "attrs",     label: "② 商品属性",   children: <TabAttrs product={product} /> },
              { key: "images",    label: "③ 商品图片",   children: <TabImages product={product} /> },
              { key: "sku",       label: "④ SKU规格",    children: <TabSKU product={product} /> },
              { key: "desc",      label: "⑤ 商品详情",   children: <TabDesc product={product} /> },
              { key: "logistics", label: "⑥ 物流信息",   children: <TabLogistics /> },
              { key: "aftersale", label: "⑦ 售后服务",   children: <TabAfterSale /> },
            ]}
          />
        </Form>
      </div>
    </div>
  );
}
