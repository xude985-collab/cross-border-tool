"use client";
import { useState, useEffect, use } from "react";
import { Table, Button, Tag, Checkbox, message, Popconfirm, Image, Space } from "antd";
import { getBatchProducts, batchUpload, getBatchStats } from "@/lib/api";
import Link from "next/link";

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  pending:        { color: "default",    text: "待处理" },
  fetching:       { color: "processing", text: "抓取中" },
  ai_processing:  { color: "blue",       text: "AI处理中" },
  ready:          { color: "green",      text: "就绪" },
  uploading:      { color: "orange",     text: "上传中" },
  uploaded:       { color: "success",    text: "已上传" },
  failed:         { color: "error",      text: "失败" },
};

export default function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<any>({});

  const load = () => {
    getBatchProducts(Number(id)).then(setProducts);
    getBatchStats(Number(id)).then(setStats);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [id]);

  const readyIds = products.filter(p => p.status === "ready").map(p => p.id);

  const handleUpload = async (ids: number[]) => {
    if (!ids.length) { message.warning("没有可上传的商品"); return; }
    setUploading(true);
    try {
      const res = await batchUpload(ids);
      message.success(`上传完成：成功 ${res.success.length} 个，失败 ${res.failed.length} 个`);
      load();
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { title: "", key: "check", width: 40,
      render: (_: any, r: any) => r.status === "ready" && (
        <Checkbox checked={selected.includes(r.id)}
          onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(i => i !== r.id))} />
      )},
    { title: "商品图", key: "img", width: 80,
      render: (_: any, r: any) => r.images_listing?.[0]
        ? <Image src={r.images_listing[0]} width={60} height={60} style={{ objectFit: "cover" }} alt="" />
        : <div className="w-14 h-14 bg-gray-100 rounded" /> },
    { title: "1688原标题", dataIndex: "title_zh", key: "title_zh", ellipsis: true, width: 200 },
    { title: "AI英文标题", dataIndex: "title_en", key: "title_en", ellipsis: true },
    { title: "状态", dataIndex: "status", key: "status", width: 100,
      render: (s: string) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.text || s}</Tag> },
    { title: "操作", key: "action", width: 120,
      render: (_: any, r: any) => (
        <Space>
          <Link href={`/product/${r.id}`}><Button size="small">编辑</Button></Link>
          {r.status === "ready" &&
            <Button size="small" type="primary"
              onClick={() => handleUpload([r.id])}>上传</Button>}
        </Space>
      )},
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">批次 #{id}</h1>
          <span className="text-gray-500 text-sm">
            总计 {stats.total || 0} 个 · 就绪 {stats.stats?.ready || 0} · 已上传 {stats.stats?.uploaded || 0}
          </span>
        </div>
        <Space>
          <Button onClick={() => setSelected(readyIds)}>全选就绪({readyIds.length})</Button>
          <Popconfirm title={`确认上传选中的 ${selected.length} 个商品？`}
            onConfirm={() => handleUpload(selected)}>
            <Button type="primary" loading={uploading} disabled={!selected.length}>
              批量上传选中({selected.length})
            </Button>
          </Popconfirm>
          <Popconfirm title={`确认上传全部 ${readyIds.length} 个就绪商品？`}
            onConfirm={() => handleUpload(readyIds)}>
            <Button type="primary" danger loading={uploading}>
              一键上传全部就绪({readyIds.length})
            </Button>
          </Popconfirm>
        </Space>
      </div>
      <Table columns={columns} dataSource={products} rowKey="id" pagination={{ pageSize: 50 }} />
    </div>
  );
}
