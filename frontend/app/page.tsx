"use client";
import { useState, useEffect } from "react";
import { Table, Button, Tag, Progress } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getBatches } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatches().then(setBatches).finally(() => setLoading(false));
    const timer = setInterval(() => getBatches().then(setBatches), 5000);
    return () => clearInterval(timer);
  }, []);

  const columns = [
    { title: "批次名称", dataIndex: "name", key: "name",
      render: (name: string, r: any) => <Link href={`/batch/${r.id}`} className="text-blue-600">{name}</Link> },
    { title: "商品总数", dataIndex: "total", key: "total" },
    { title: "AI处理进度", key: "progress", render: (_: any, r: any) => (
      <Progress percent={r.total ? Math.round((r.ready + r.uploaded) / r.total * 100) : 0}
        size="small" style={{ width: 140 }} />
    )},
    { title: "就绪", dataIndex: "ready", key: "ready",
      render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: "已上传", dataIndex: "uploaded", key: "uploaded",
      render: (v: number) => <Tag color="blue">{v}</Tag> },
    { title: "失败", dataIndex: "failed", key: "failed",
      render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag>{v}</Tag> },
    { title: "创建时间", dataIndex: "created_at", key: "created_at",
      render: (v: string) => new Date(v).toLocaleString("zh-CN") },
    { title: "操作", key: "action", render: (_: any, r: any) => (
      <Link href={`/batch/${r.id}`}><Button size="small">查看 / 上传</Button></Link>
    )},
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">跨境铺货平台 · 批次管理</h1>
        <Link href="/import">
          <Button type="primary" icon={<PlusOutlined />} size="large">新建批次</Button>
        </Link>
      </div>
      <Table columns={columns} dataSource={batches} rowKey="id" loading={loading}
        pagination={{ pageSize: 20 }} />
    </div>
  );
}
