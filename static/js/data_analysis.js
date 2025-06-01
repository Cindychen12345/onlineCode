document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    let editor;
    let uploadedFile = null;
    let fileData = null;
    let columns = [];
    let dataTypes = {};
    
    // 初始化CodeMirror编辑器
    editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineWrapping: true
    });
    
    // 设置初始代码
    const initialCode = `# 数据分析代码
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 数据将在此处加载
# df = pd.read_csv('your_file.csv')
`;
    editor.setValue(initialCode);
    
    // 文件上传区域拖放功能
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-upload');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });
    
    // 处理文件上传
    function handleFileUpload(file) {
        uploadedFile = file;
        const fileName = file.name;
        const fileType = fileName.split('.').pop().toLowerCase();
        
        // 检查文件类型
        if (!['csv', 'xlsx', 'xls'].includes(fileType)) {
            alert('不支持的文件格式。请上传 CSV 或 Excel 文件。');
            return;
        }
        
        // 显示加载状态
        document.getElementById('columns-list').innerHTML = '<p class="text-center">正在处理文件...</p>';
        document.getElementById('data-preview').innerHTML = '<p class="text-center">正在加载数据...</p>';
        
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        
        // 发送文件到后端
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('上传文件时出错: ' + data.error);
                return;
            }
            
            // 存储文件数据
            fileData = {
                fileName: data.filename,
                shape: data.shape,
                columns: data.columns,
                dtypes: data.dtypes
            };
            
            // 显示列名
            displayColumns(data.columns, data.dtypes);
            
            // 显示数据预览
            fetchDataPreview(data.filename);
            
            // 更新编辑器代码
            const loadCode = `# 数据分析代码
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 加载数据
df = pd.read_csv('${data.filename}')

# 查看数据基本信息
print("数据形状:", df.shape)
print("\\n数据列:", df.columns.tolist())
print("\\n数据类型:\\n", df.dtypes)
print("\\n数据预览:\\n", df.head())
`;
            editor.setValue(loadCode);
        })
        .catch(error => {
            alert('上传文件时出错: ' + error.message);
        });
    }
    
    // 显示列名
    function displayColumns(columns, dtypes) {
        const columnsContainer = document.getElementById('columns-list');
        columnsContainer.innerHTML = '';
        
        if (!columns || columns.length === 0) {
            columnsContainer.innerHTML = '<p class="text-muted">没有可用的列</p>';
            return;
        }
        
        columns.forEach(column => {
            const columnType = getColumnType(dtypes[column]);
            const columnItem = document.createElement('div');
            columnItem.className = 'column-item';
            columnItem.dataset.column = column;
            
            columnItem.innerHTML = `
                <input type="checkbox" id="col-${column}" class="column-checkbox">
                <label for="col-${column}" class="column-name">${column}</label>
                <span class="column-type ${columnType.class}">${columnType.label}</span>
            `;
            
            columnsContainer.appendChild(columnItem);
            
            // 添加点击事件
            columnItem.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                }
                
                // 切换选中状态
                if (this.querySelector('input[type="checkbox"]').checked) {
                    this.classList.add('selected');
                } else {
                    this.classList.remove('selected');
                }
            });
        });
    }
    
    // 获取列类型
    function getColumnType(dtype) {
        if (!dtype) return { label: '未知', class: '' };
        
        const dtypeStr = String(dtype).toLowerCase();
        
        if (dtypeStr.includes('int') || dtypeStr.includes('float')) {
            return { label: '数值', class: 'numeric' };
        } else if (dtypeStr.includes('datetime')) {
            return { label: '日期', class: 'datetime' };
        } else if (dtypeStr.includes('bool')) {
            return { label: '布尔', class: 'boolean' };
        } else {
            return { label: '文本', class: 'text' };
        }
    }
    
    // 获取数据预览
    function fetchDataPreview(filename) {
        const previewContainer = document.getElementById('data-preview');
        previewContainer.innerHTML = '<p class="text-center">正在加载数据预览...</p>';
        
        fetch('/preview_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                previewContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }
            
            // 创建表格
            const table = document.createElement('table');
            table.className = 'table table-sm';
            
            // 添加表头
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            data.columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // 添加表体
            const tbody = document.createElement('tbody');
            
            data.data.forEach(row => {
                const tr = document.createElement('tr');
                
                data.columns.forEach(column => {
                    const td = document.createElement('td');
                    td.textContent = row[column] !== null ? row[column] : 'NA';
                    if (row[column] === null || row[column] === '') {
                        td.className = 'text-muted';
                        td.textContent = 'NA';
                    }
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            previewContainer.innerHTML = '';
            previewContainer.appendChild(table);
        })
        .catch(error => {
            previewContainer.innerHTML = `<div class="alert alert-danger">加载数据预览时出错: ${error.message}</div>`;
        });
    }
    
    // 全选/取消全选按钮
    document.getElementById('select-all-cols').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.column-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.column-item').classList.add('selected');
        });
    });
    
    document.getElementById('deselect-all-cols').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.column-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.column-item').classList.remove('selected');
        });
    });
    
    // 列操作按钮事件
    const operationButtons = document.querySelectorAll('[data-operation]');
    operationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const operation = this.getAttribute('data-operation');
            const selectedColumns = getSelectedColumns();
            
            if (selectedColumns.length === 0) {
                alert('请至少选择一列进行操作');
                return;
            }
            
            // 根据操作类型生成代码
            generateCode(operation, selectedColumns);
        });
    });
    
    // 获取选中的列
    function getSelectedColumns() {
        const selectedColumns = [];
        const checkboxes = document.querySelectorAll('.column-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const columnItem = checkbox.closest('.column-item');
            selectedColumns.push(columnItem.dataset.column);
        });
        
        return selectedColumns;
    }
    
    // 生成操作代码
    function generateCode(operation, columns) {
        if (!fileData) {
            alert('请先上传数据文件');
            return;
        }
        
        let code = '';
        const columnsStr = columns.length > 1 
            ? `[${columns.map(c => `'${c}'`).join(', ')}]` 
            : `'${columns[0]}'`;
        
        switch (operation) {
            case 'drop_na':
                code = `# 删除 ${columns.join(', ')} 列中包含空值的行
rows_before = df.shape[0]
df_no_na = df.dropna(subset=${columnsStr})
rows_after = df_no_na.shape[0]
print(f"删除空值前行数: {rows_before}")
print(f"删除空值后行数: {rows_after}")
print(f"删除的行数: {rows_before - rows_after}")
df = df_no_na  # 更新数据框

# 显示处理后的数据预览
print("\\n处理后数据预览:")
print(df.head())
`;
                break;
                
            case 'drop_duplicates':
                code = `# 删除 ${columns.join(', ')} 列的重复值
rows_before = df.shape[0]
df_no_duplicates = df.drop_duplicates(subset=${columnsStr})
rows_after = df_no_duplicates.shape[0]
print(f"删除重复值前行数: {rows_before}")
print(f"删除重复值后行数: {rows_after}")
print(f"删除的重复行数: {rows_before - rows_after}")
df = df_no_duplicates  # 更新数据框

# 显示处理后的数据预览
print("\\n处理后数据预览:")
print(df.head())
`;
                break;
                
            case 'fillna':
                code = `# 填充 ${columns.join(', ')} 列的空值
# 对于数值列使用均值填充，对于非数值列使用众数填充
for col in ${columnsStr}:
    null_count_before = df[col].isna().sum()
    
    if pd.api.types.is_numeric_dtype(df[col]):
        fill_value = df[col].mean()
        print(f"列 {col} 使用均值 {fill_value:.2f} 填充空值")
    else:
        fill_value = df[col].mode()[0] if not df[col].mode().empty else "未知"
        print(f"列 {col} 使用众数 '{fill_value}' 填充空值")
    
    df[col] = df[col].fillna(fill_value)
    null_count_after = df[col].isna().sum()
    print(f"列 {col} 填充前空值数: {null_count_before}, 填充后空值数: {null_count_after}")

# 显示处理后的数据预览
print("\\n处理后数据预览:")
print(df.head())
`;
                break;
                
            case 'value_counts':
                if (columns.length > 1) {
                    code = `# 分别计算 ${columns.join(', ')} 列的值计数
for col in ${columnsStr}:
    print(f"\\n列 {col} 的值计数:")
    value_counts = df[col].value_counts()
    print(value_counts)
    
    # 计算空值数量
    null_count = df[col].isna().sum()
    if null_count > 0:
        print(f"空值数量: {null_count}")
    
    # 绘制前10个值的条形图
    plt.figure(figsize=(10, 6))
    value_counts.head(10).plot(kind='bar')
    plt.title(f"{col} 列值分布")
    plt.xlabel(col)
    plt.ylabel("计数")
    plt.tight_layout()
    plt.show()
`;
                } else {
                    code = `# 计算 ${columns[0]} 列的值计数
value_counts = df['${columns[0]}'].value_counts()
print("值计数:")
print(value_counts)

# 计算空值数量
null_count = df['${columns[0]}'].isna().sum()
if null_count > 0:
    print(f"空值数量: {null_count}")

# 绘制前10个值的条形图
plt.figure(figsize=(10, 6))
value_counts.head(10).plot(kind='bar')
plt.title("${columns[0]} 列值分布")
plt.xlabel("${columns[0]}")
plt.ylabel("计数")
plt.tight_layout()
plt.show()
`;
                }
                break;
                
            case 'describe':
                code = `# ${columns.join(', ')} 列的描述统计
stats = df[${columnsStr}].describe(include='all')
print("描述统计:")
print(stats)

# 对于数值列，绘制箱线图
numeric_cols = [col for col in ${columnsStr} if pd.api.types.is_numeric_dtype(df[col])]
if numeric_cols:
    plt.figure(figsize=(12, 6))
    df[numeric_cols].boxplot()
    plt.title("数值列箱线图")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()
`;
                break;
                
            case 'correlation':
                if (columns.length < 2) {
                    alert('相关性分析需要至少选择两列');
                    return;
                }
                
                code = `# ${columns.join(', ')} 列的相关性分析
# 只选择数值列进行相关性分析
numeric_cols = [col for col in ${columnsStr} if pd.api.types.is_numeric_dtype(df[col])]

if not numeric_cols:
    print("所选列中没有数值列，无法进行相关性分析")
elif len(numeric_cols) < 2:
    print("相关性分析需要至少两个数值列，当前只有一个数值列")
else:
    corr = df[numeric_cols].corr()
    print("相关性矩阵:")
    print(corr)
    
    # 绘制热力图
    plt.figure(figsize=(10, 8))
    plt.imshow(corr, cmap='coolwarm', interpolation='none', aspect='auto')
    plt.colorbar()
    plt.xticks(range(len(numeric_cols)), numeric_cols, rotation=45)
    plt.yticks(range(len(numeric_cols)), numeric_cols)
    
    # 添加相关系数文本
    for i in range(len(numeric_cols)):
        for j in range(len(numeric_cols)):
            plt.text(j, i, f"{corr.iloc[i, j]:.2f}",
                     ha="center", va="center", color="black")
    
    plt.title("相关性热力图")
    plt.tight_layout()
    plt.show()
`;
                break;
                
            case 'histogram':
                if (columns.length > 4) {
                    alert('直方图一次最多选择4列，以保证可视化效果');
                    return;
                }
                
                code = `# ${columns.join(', ')} 列的直方图
# 只为数值列绘制直方图
numeric_cols = [col for col in ${columnsStr} if pd.api.types.is_numeric_dtype(df[col])]

if not numeric_cols:
    print("所选列中没有数值列，无法绘制直方图")
else:
    # 计算子图布局
    n_cols = len(numeric_cols)
    n_rows = (n_cols + 1) // 2  # 向上取整
    
    fig, axes = plt.subplots(n_rows, min(n_cols, 2), figsize=(12, 4 * n_rows))
    axes = axes.flatten() if n_cols > 1 else [axes]
    
    for i, col in enumerate(numeric_cols):
        # 计算合适的bin数
        n_bins = min(30, max(10, int(df[col].nunique() / 3)))
        
        # 绘制直方图
        axes[i].hist(df[col].dropna(), bins=n_bins, alpha=0.7, color='skyblue', edgecolor='black')
        axes[i].set_title(f"{col} 分布")
        axes[i].set_xlabel(col)
        axes[i].set_ylabel("频率")
        
        # 添加均值和中位数线
        mean_val = df[col].mean()
        median_val = df[col].median()
        axes[i].axvline(mean_val, color='red', linestyle='--', linewidth=1, label=f'均值: {mean_val:.2f}')
        axes[i].axvline(median_val, color='green', linestyle='-.', linewidth=1, label=f'中位数: {median_val:.2f}')
        axes[i].legend()
    
    plt.tight_layout()
    plt.show()
`;
                break;
                
            case 'boxplot':
                code = `# ${columns.join(', ')} 列的箱线图
# 只为数值列绘制箱线图
numeric_cols = [col for col in ${columnsStr} if pd.api.types.is_numeric_dtype(df[col])]

if not numeric_cols:
    print("所选列中没有数值列，无法绘制箱线图")
else:
    plt.figure(figsize=(12, 6))
    df[numeric_cols].boxplot()
    plt.title("箱线图")
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.show()
    
    # 显示基本统计量
    print("基本统计量:")
    stats = df[numeric_cols].describe()
    print(stats)
    
    # 检测异常值
    print("\\n潜在异常值检测:")
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
        print(f"{col} 列有 {len(outliers)} 个潜在异常值")
        if len(outliers) > 0 and len(outliers) <= 10:
            print(f"异常值: {outliers.values}")
`;
                break;
                
            case 'scatter':
                if (columns.length !== 2) {
                    alert('散点图需要选择恰好两列');
                    return;
                }
                
                if (!isNumericColumn(columns[0]) || !isNumericColumn(columns[1])) {
                    alert('散点图需要两个数值列');
                    return;
                }
                
                code = `# ${columns[0]} 和 ${columns[1]} 的散点图
plt.figure(figsize=(10, 6))
plt.scatter(df['${columns[0]}'], df['${columns[1]}'], alpha=0.6)
plt.title("${columns[0]} vs ${columns[1]} 散点图")
plt.xlabel("${columns[0]}")
plt.ylabel("${columns[1]}")
plt.grid(True, linestyle='--', alpha=0.7)

# 添加趋势线
if df['${columns[0]}'].nunique() > 1:  # 确保有足够的不同值来拟合线
    z = np.polyfit(df['${columns[0]}'].dropna(), df['${columns[1]}'].dropna(), 1)
    p = np.poly1d(z)
    plt.plot(df['${columns[0]}'].sort_values(), p(df['${columns[0]}'].sort_values()), 
             "r--", linewidth=2, label=f"趋势线: y={z[0]:.2f}x+{z[1]:.2f}")
    plt.legend()

# 计算相关系数
corr = df['${columns[0]}'].corr(df['${columns[1]}'])
plt.annotate(f"相关系数: {corr:.2f}", xy=(0.05, 0.95), xycoords='axes fraction',
             bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="gray", alpha=0.8))

plt.tight_layout()
plt.show()

# 显示基本统计信息
print(f"{columns[0]} 和 {columns[1]} 的统计信息:")
print(df[[columns[0], columns[1]]].describe())
print(f"\\n相关系数: {corr:.4f}")
`;
                break;
        }
        
        // 将生成的代码添加到编辑器
        const currentCode = editor.getValue();
        editor.setValue(currentCode + '\n' + code);
        
        // 滚动到编辑器底部
        const lastLine = editor.lineCount() - 1;
        editor.scrollIntoView({line: lastLine});
    }
    
    // 检查列是否为数值类型
    function isNumericColumn(column) {
        if (!fileData || !fileData.dtypes) return false;
        
        const dtype = fileData.dtypes[column];
        if (!dtype) return false;
        
        const dtypeStr = String(dtype).toLowerCase();
        return dtypeStr.includes('int') || dtypeStr.includes('float');
    }
    
    // 运行代码按钮事件
    document.getElementById('run-code').addEventListener('click', function() {
        const code = editor.getValue();
        if (!code.trim()) {
            alert('请先编写代码');
            return;
        }
        
        // 显示加载状态
        const resultsArea = document.getElementById('analysis-results');
        resultsArea.innerHTML = '<p class="text-center">正在运行代码...</p>';
        resultsArea.classList.add('loading');
        
        // 发送代码到后端执行
        fetch('/run_code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                file: fileData ? fileData.fileName : null
            })
        })
        .then(response => response.json())
        .then(data => {
            resultsArea.classList.remove('loading');
            
            if (data.error) {
                resultsArea.innerHTML = `<div class="alert alert-danger">
                    <strong>错误:</strong>
                    <pre>${data.error}</pre>
                </div>`;
            } else {
                let resultHtml = '';
                
                // 显示文本输出
                if (data.output) {
                    resultHtml += `<div class="mb-4">
                        <h6>输出结果:</h6>
                        <pre>${data.output}</pre>
                    </div>`;
                }
                
                // 显示图表（如果有）
                if (data.plots && data.plots.length > 0) {
                    resultHtml += `<div class="mb-4">
                        <h6>生成的图表:</h6>
                        <div class="row">`;
                    
                    data.plots.forEach(plot => {
                        resultHtml += `<div class="col-md-6 mb-3">
                            <div class="plot-container">
                                <img src="data:image/png;base64,${plot}" class="img-fluid" alt="数据可视化">
                            </div>
                        </div>`;
                    });
                    
                    resultHtml += `</div></div>`;
                }
                
                resultsArea.innerHTML = resultHtml || '<p>代码执行成功，但没有输出结果</p>';
            }
        })
        .catch(error => {
            resultsArea.classList.remove('loading');
            resultsArea.innerHTML = `<div class="alert alert-danger">
                <strong>请求错误:</strong> ${error.message}
            </div>`;
        });
    });
    
    // 清空代码按钮事件
    document.getElementById('clear-code').addEventListener('click', function() {
        if (confirm('确定要清空当前代码吗？')) {
            editor.setValue(initialCode);
        }
    });
});