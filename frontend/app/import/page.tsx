"use client";
import { useState } from "react";
import { Input, Button, Form, InputNumber, Card, message, Steps } from "antd";
import { importProducts } from "@/lib/api";
import { useRouter } from "next/navigation";

const { TextArea } = Input;

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    const urls = values.urls
      .split("\n")
      .map((u: string) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) { message.error("请输入至少一个链接"); return; }
    if (urls.length > 500) { message.error("每次最多500个"); return; }
    setLoading(true);
    try {
      const res = await importProducts(urls, values.batchName, values.priceMultiplier);
      message.success(`已加入队列 ${res.queued} 个商品，AI处理中...`);
      router.push(`/batch/${res.batch_id}`);
    } catch {
      message.error("提交失败，请检查后端服务");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">新建批次 · 批量导入1688商品</h1>
      <p className="text-gray-500 mb-6">粘贴1688商品链接，系统自动完成AI优化 → 生成图片 → 准备上传速卖通</p>

      <Steps className="mb-8" items={[
        { title: "粘贴链接", description: "支持100-500个" },
        { title: "AI处理", description: "标题/描述/图片" },
        { title: "预览确认", description: "可批量微调" },
        { title: "一键上传", description: "到速卖通" },
      ]} />

      <Card>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ priceMultiplier: 3.0, batchName: `批次 ${new Date().toLocaleDateString("zh-CN")}` }}>
          <Form.Item label="批次名称" name="batchName" rules={[{ required: true }]}>
            <Input placeholder="如：夏季女装 第一批" />
          </Form.Item>

          <Form.Item label="定价倍率（最终价 = 1688价 × 倍率）" name="priceMultiplier">
            <InputNumber min={1} max={20} step={0.1} style={{ width: 150 }} addonAfter="x" />
          </Form.Item>

          <Form.Item
            label={`1688商品链接（每行一个，支持100-500个）`}
            name="urls"
            rules={[{ required: true, message: "请输入链接" }]}
          >
            <TextArea
              rows={12}
              placeholder={"https://detail.1688.com/offer/123456789.html\nhttps://detail.1688.com/offer/987654321.html\n..."}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              开始批量处理（AI自动优化）
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
