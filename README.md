This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 初期ログイン情報

seed 実行後に以下のアカウントでログインできます。

| ロール | メールアドレス | パスワード | 備考 |
|--------|---------------|-----------|------|
| 管理者 (admin) | admin@example.com | admin1234 | 全クライアントのデータを閲覧可能 |
| クライアントA (client) | clienta@example.com | clienta1234 | client-a のデータのみ |
| クライアントB (client) | clientb@example.com | clientb1234 | client-b のデータのみ |

**注意:** 本番環境ではパスワードを変更し、`SESSION_SECRET` 環境変数を設定してください。

## クライアント管理

管理者は `/admin/clients` から新規クライアントを追加できます。

- 会社名、クライアントキー、ログイン用メールアドレス、初期パスワードを入力
- 既存クライアントの見積ルールをコピーして初期設定可能
- クライアント作成時に Client レコード、User アカウント、EstimateRule のコピーがトランザクションで一括作成されます

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
