"use client";
import { useState, useEffect } from "react";
import { Button, Table, Tag, Card, Row, Col, Statistic } from "antd";
import { PlusOutlined, ShoppingOutlined, RocketOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { getBatches } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatches()
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: batches.reduce((s, b) => s + (b.total_products || 0), 0),
    ready: batches.reduce((s, b) => s + (b.ready_count || 0), 0),
    uploaded: batches.reduce((s, b) => s + (b.uploaded_count || 0), 0),
  };

  const columns = [
    { title: "批次名称", dataIndex: "name", key: "name",
      render: (t: string, r: any) => <Link href={`/batch/${r.id}`} className="text-blue-600 hover:underline">{t}</Link> },
    { title: "商品数", dataIndex: "total_products", key: "total", width: 80 },
    { title: "状态", key: "status", width: 120,
      render: (_: any, r: any) => {
        const p = r.total_products || 1;
        const done = (r.ready_count || 0) + (r.uploaded_count || 0);
        if (done >= p) return <Tag color="green">全部就绪</Tag>;
        if (done > 0) return <Tag color="blue">处理中 {done}/{p}</Tag>;
        return <Tag color="orange">等待处理</Tag>;
      }},
    { title: "创建时间", dataIndex: "created_at", key: "time", width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString("zh-CN") : "-" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <RocketOutlined className="text-white text-lg" />
          </div>
          <span className="text-lg font-bold text-gray-800">跨境铺货工具</span>
          <span className="text-xs text-gray-400 ml-2">1688 → 速卖通 AI一键铺货</span>
        </div>
        <Link href="/import">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            新建批次
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <Row gutter={24} className="mb-8">
          <Col span={8}>
            <Card>
              <Statistic title="总商品数" value={stats.total} prefix={<ShoppingOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="已就绪" value={stats.ready} valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="已上传速卖通" value={stats.uploaded} valueStyle={{ color: "#1677ff" }}
                prefix={<RocketOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* 批次列表 */}
        <Card title="批次列表" extra={
          <Link href="/import">
            <Button type="link" icon={<PlusOutlined />}>新建批次</Button>
          </Link>
        }>
          {batches.length === 0 && !loading ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingOutlined className="text-5xl mb-4 block" />
              <p className="text-lg mb-2">还没有批次</p>
              <p className="text-sm mb-6">粘贴1688商品链接，AI自动生成标题/描述/图片，一键上传速卖通</p>
              <Link href="/import">
                <Button type="primary" icon={<PlusOutlined />}>创建第一个批次</Button>
              </Link>
            </div>
          ) : (
            <Table columns={columns} dataSource={batches} rowKey="id" loading={loading}
              pagination={{ pageSize: 20 }} />
          )}
        </Card>
      </div>
    </div>
  );
}
