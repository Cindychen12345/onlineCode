from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import traceback
from pathlib import Path
import os
import json

app = Flask(__name__)

# 配置上传文件存储目录
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)

# 存储已上传的数据框
data_frames = {}

@app.route('/')
def index():
    return render_template('data_analysis.html')

@app.route('/run_code', methods=['POST'])
def run_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        filename = data.get('file')

        if not code:
            return jsonify({'error': '没有提供代码'})

        # 捕获打印输出
        output_buffer = io.StringIO()
        # 捕获图表
        plot_outputs = []

        # 创建本地环境
        local_env = {
            'pd': pd,
            'np': np,
            'plt': plt,
            'print': lambda *args, **kwargs: print(*args, **kwargs, file=output_buffer)
        }

        # 如果有文件名，尝试加载数据
        if filename:
            file_path = UPLOAD_FOLDER / filename
            if file_path.exists():
                if filename.endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif filename.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(file_path)
                else:
                    return jsonify({'error': '不支持的文件格式'})
                local_env['df'] = df

        # 执行代码
        exec(code, local_env)

        # 获取所有生成的图表
        for i in plt.get_fignums():
            fig = plt.figure(i)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            plot_outputs.append(base64.b64encode(buf.getvalue()).decode('utf-8'))
            plt.close(fig)

        return jsonify({
            'output': output_buffer.getvalue(),
            'plots': plot_outputs
        })

    except Exception as e:
        error_msg = f"错误类型: {type(e).__name__}\n"
        error_msg += f"错误信息: {str(e)}\n"
        error_msg += "详细追踪:\n"
        error_msg += traceback.format_exc()
        return jsonify({'error': error_msg})

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件被上传'})

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'})

        # 检查文件扩展名
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            return jsonify({'error': '不支持的文件格式'})

        # 保存文件
        filename = file.filename
        file_path = UPLOAD_FOLDER / filename
        file.save(file_path)

        # 读取文件并获取基本信息
        if filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        # 存储数据框
        data_frames[filename] = df

        # 转换dtypes为字符串格式
        dtypes = {}
        for col, dtype in df.dtypes.items():
            if pd.api.types.is_integer_dtype(dtype):
                dtypes[col] = 'int'
            elif pd.api.types.is_float_dtype(dtype):
                dtypes[col] = 'float'
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                dtypes[col] = 'datetime'
            elif pd.api.types.is_bool_dtype(dtype):
                dtypes[col] = 'bool'
            else:
                dtypes[col] = 'object'

        return jsonify({
            'success': True,
            'filename': filename,
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': dtypes
        })

    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/preview_data', methods=['POST'])
def preview_data():
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': '未提供文件名'})
        
        df = data_frames.get(filename)
        if df is None:
            return jsonify({'error': '没有找到数据'})
        
        # 获取前5行数据
        preview_data = df.head().to_dict('records')
        
        # 转换数据类型
        for row in preview_data:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
                elif isinstance(value, (np.integer, np.floating)):
                    row[key] = float(value) if isinstance(value, np.floating) else int(value)
                else:
                    row[key] = str(value)
        
        return jsonify({
            'columns': df.columns.tolist(),
            'data': preview_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    try:
        filename = request.json.get('filename')
        if filename and filename in data_frames:
            del data_frames[filename]
            file_path = UPLOAD_FOLDER / filename
            if file_path.exists():
                os.remove(file_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=5000)