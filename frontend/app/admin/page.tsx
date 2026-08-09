"use client";
import { useEffect, useState } from "react";
import { Table, Switch, Tag, message, Button, Modal, Form, Input } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      // 获取当前用户信息
      const meRes = await fetch("https://cross-border-tool.onrender.com/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("未登录");
      const me = await meRes.json();
      setCurrentUser(me);

      if (me.role !== "admin") {
        message.error("需要管理员权限");
        router.push("/");
        return;
      }

      // 获取所有用户
      const usersRes = await fetch("https://cross-border-tool.onrender.com/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersRes.ok) throw new Error("获取用户列表失败");
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (err: any) {
      message.error(err.message);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (values: any) => {
    const token = localStorage.getItem("token");
    setCreateLoading(true);
    try {
      const res = await fetch("https://cross-border-tool.onrender.com/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "创建失败");
      }

      message.success("用户创建成功");
      setCreateModalOpen(false);
      form.resetFields();
      checkAuth(); // 刷新列表
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "active" ? "disabled" : "active";

    try {
      const res = await fetch(
        `https://cross-border-tool.onrender.com/api/users/${userId}/status?status=${newStatus}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("操作失败");

      message.success(`用户已${newStatus === "active" ? "启用" : "禁用"}`);
      checkAuth(); // 刷新列表
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "邮箱", dataIndex: "email" },
    { title: "姓名", dataIndex: "full_name" },
    {
      title: "角色",
      dataIndex: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "管理员" : "用户"}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: string, record: any) => (
        <Switch
          checked={status === "active"}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={() => toggleUserStatus(record.id, status)}
          disabled={record.role === "admin" && record.id !== currentUser?.id}
        />
      ),
    },
    {
      title: "注册时间",
      dataIndex: "created_at",
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="flex gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            创建用户
          </Button>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      {/* 创建用户弹窗 */}
      <Modal
        title="创建用户"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={createUser} layout="vertical">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ required: true, type: "email", message: "请输入正确的邮箱" }]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            label="姓名"
            name="full_name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="张三" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, min: 6, message: "密码至少6位" }]}
          >
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createLoading} block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
