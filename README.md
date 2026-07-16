# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Environment variables

Copy `.env.example` to `.env` and fill in your own values — `.env` is
git-ignored and should never be committed.

| Variable | Used for |
| --- | --- |
| `VITE_CLOUDINARY_CLOUD_NAME` | Profile photo uploads (Register / Edit Profile) — your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | An **unsigned** Cloudinary upload preset (Cloudinary dashboard → Settings → Upload → Upload presets) |

These are safe to expose in client-side code: the app only ever performs
unsigned Cloudinary uploads, so no Cloudinary API secret is used anywhere
in this repository.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
