process.env.PORT = process.env.PORT || '4175';
process.env.SILICONFLOW_API_KEY = '';

await import('../server.ts');
