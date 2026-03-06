# %% [markdown]
# # 🚨 Churn Analysis & Prediction
# 
# Builds a customer feature table, trains classifiers, and scores every customer with a churn probability.

# %%
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import timedelta

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (classification_report, confusion_matrix,
                              roc_auc_score, RocCurveDisplay)
import warnings
warnings.filterwarnings('ignore')

df = pd.read_csv('cleaned_data.csv', parse_dates=['order_date'])
print(f'Loaded {len(df):,} rows')

# %% [markdown]
# ## 1. Define Churn Label (no purchase in last 90 days)

# %%
snapshot = df['order_date'].max()
churn_threshold = 90  # days

last_purchase = df.groupby('customer_id')['order_date'].max().reset_index()
last_purchase['days_since'] = (snapshot - last_purchase['order_date']).dt.days
last_purchase['churned'] = (last_purchase['days_since'] > churn_threshold).astype(int)

print(f'Churned customers (>{churn_threshold} days inactive): {last_purchase["churned"].sum():,}')
print(f'Active customers: {(last_purchase["churned"]==0).sum():,}')
print(f'Churn rate: {last_purchase["churned"].mean()*100:.1f}%')

# %% [markdown]
# ## 2. Build Customer Feature Table

# %%
features = df.groupby('customer_id').agg(
    total_orders=('order_id', 'nunique'),
    total_spend=('total_amount', 'sum'),
    avg_order_value=('total_amount', 'mean'),
    total_quantity=('quantity', 'sum'),
    avg_discount=('discount_pct', 'mean'),
    return_count=('is_returned', 'sum'),
    avg_review=('review_score', 'mean'),
    unique_categories=('product_category', 'nunique'),
    unique_products=('product_id', 'nunique'),
    customer_age=('customer_age', 'first'),
    customer_gender=('customer_gender', 'first'),
    country=('country', 'first'),
    payment_method=('payment_method', 'first'),
    first_order=('order_date', 'min'),
    last_order=('order_date', 'max')
).reset_index()

features['lifespan_days'] = (features['last_order'] - features['first_order']).dt.days
features['return_rate'] = features['return_count'] / features['total_orders']
features['days_since_last'] = (snapshot - features['last_order']).dt.days

# Merge churn label
features = features.merge(last_purchase[['customer_id','churned']], on='customer_id')

print(f'Feature table: {features.shape}')
features.head()

# %% [markdown]
# ## 3. Prepare Features for ML

# %%
# Encode categoricals
cat_cols = ['customer_gender','country','payment_method']
le = LabelEncoder()
for col in cat_cols:
    features[col + '_enc'] = le.fit_transform(features[col].astype(str))

feature_cols = [
    'total_orders','total_spend','avg_order_value','total_quantity',
    'avg_discount','return_rate','avg_review','unique_categories',
    'unique_products','customer_age','lifespan_days','days_since_last',
    'customer_gender_enc','country_enc','payment_method_enc'
]

X = features[feature_cols].fillna(0)
y = features['churned']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2,
                                                      random_state=42, stratify=y)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

print(f'Train: {X_train.shape}, Test: {X_test.shape}')

# %% [markdown]
# ## 4. Train & Compare Models

# %%
models = {
    'Logistic Regression': LogisticRegression(max_iter=500, random_state=42),
    'Random Forest':       RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting':   GradientBoostingClassifier(n_estimators=100, random_state=42)
}

results = {}
for name, model in models.items():
    Xtr = X_train_sc if name == 'Logistic Regression' else X_train
    Xte = X_test_sc  if name == 'Logistic Regression' else X_test
    model.fit(Xtr, y_train)
    y_pred = model.predict(Xte)
    y_prob = model.predict_proba(Xte)[:,1]
    auc = roc_auc_score(y_test, y_prob)
    results[name] = {'model': model, 'auc': auc, 'y_pred': y_pred, 'y_prob': y_prob}
    print(f'\n=== {name} — AUC: {auc:.3f} ===')
    print(classification_report(y_test, y_pred, target_names=['Active','Churned']))

best_name = max(results, key=lambda k: results[k]['auc'])
print(f'\n✅ Best model: {best_name} (AUC={results[best_name]["auc"]:.3f})')

# %% [markdown]
# ## 5. Feature Importance & ROC Curve

# %%
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle('Churn Model Evaluation', fontsize=14)

# ROC curves
for name, res in results.items():
    RocCurveDisplay.from_predictions(y_test, res['y_prob'],
                                     name=f"{name} (AUC={res['auc']:.2f})",
                                     ax=axes[0])
axes[0].plot([0,1],[0,1],'k--')
axes[0].set_title('ROC Curves')

# Feature importance from best tree-based model
best_tree = results.get('Random Forest', results.get('Gradient Boosting'))
importances = pd.Series(
    best_tree['model'].feature_importances_, index=feature_cols
).sort_values(ascending=True).tail(12)
importances.plot(kind='barh', ax=axes[1], color='teal')
axes[1].set_title('Feature Importances (Random Forest)')

plt.tight_layout()
plt.savefig('churn_evaluation.png', dpi=150)
plt.show()

# %% [markdown]
# ## 6. Score All Customers & Save

# %%
best_model = results[best_name]['model']
X_all = features[feature_cols].fillna(0)
if best_name == 'Logistic Regression':
    X_all_sc = scaler.transform(X_all)
    churn_prob = best_model.predict_proba(X_all_sc)[:,1]
else:
    churn_prob = best_model.predict_proba(X_all)[:,1]

features['churn_probability'] = churn_prob.round(4)
features['churn_risk'] = pd.cut(
    features['churn_probability'],
    bins=[0, 0.33, 0.66, 1.0],
    labels=['Low', 'Medium', 'High']
)

output_cols = [
    'customer_id','total_orders','total_spend','avg_order_value',
    'days_since_last','lifespan_days','return_rate','avg_review',
    'customer_age','unique_categories','churned','churn_probability','churn_risk'
]
features[output_cols].to_csv('churn_predictions.csv', index=False)
print(f'✅ Saved churn_predictions.csv')
print(features['churn_risk'].value_counts())


