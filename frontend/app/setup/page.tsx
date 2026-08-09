"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("https://cross-border-tool.onrender.com/api/admin-setup/create-first-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail?.includes("already exists")) {
          message.error("管理员已存在，请直接登录");
          router.push("/auth");
          return;
        }
        throw new Error(data.detail || "创建失败");
      }

      message.success("管理员创建成功！");
      setTimeout(() => router.push("/auth"), 1500);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[450px]">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-gray-800">初始化系统</h1>
          <p className="text-sm text-gray-500 mt-2">创建第一个管理员账号</p>
        </div>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            label="管理员邮箱"
            name="email"
            rules={[{ required: true, type: "email", message: "请输入正确的邮箱" }]}
            initialValue="admin@tukeng.com.cn"
          >
            <Input prefix={<MailOutlined />} placeholder="admin@tukeng.com.cn" size="large" />
          </Form.Item>
          <Form.Item
            label="姓名"
            name="full_name"
            rules={[{ required: true, message: "请输入姓名" }]}
            initialValue="管理员"
          >
            <Input prefix={<UserOutlined />} placeholder="管理员" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, min: 8, message: "密码至少8位" }]}
            extra="建议使用字母+数字+符号组合"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少8位" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="mt-4"
          >
            创建管理员账号
          </Button>
        </Form>

        <div className="mt-6 text-center text-xs text-gray-400">
          已有账号？<a href="/auth" className="text-blue-500">去登录</a>
        </div>
      </div>
    </div>
  );
}
