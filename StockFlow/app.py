"""
StockFlow — Inventory & Stock Management System
Academic Mini-Project for CSE1012: Problem Solving using Python
Modern Streamlit Application with Dark Navy & Neon Cyan/Purple Design
"""

import os
import json
import datetime
import streamlit as st
import pandas as pd
try:
    import plotly.express as px
    import plotly.graph_objects as go
    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

# Import local business logic and persistence modules
import storage
import inventory_manager as im
import reports

# ==============================================================================
# Page Configuration
# ==============================================================================
st.set_page_config(
    page_title="StockFlow — Inventory Management System",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize storage directories and files
storage.initialize_storage()

# ==============================================================================
# Custom CSS: Futuristic Dark Navy & Cyan Neon Palette
# ==============================================================================
CUSTOM_CSS = """
<style>
/* Main Dark Navy Background */
[data-testid="stAppViewContainer"] {
    background-color: #061426 !important;
    color: #F1F7FF !important;
}

[data-testid="stHeader"] {
    background-color: rgba(6, 20, 38, 0.85) !important;
    backdrop-filter: blur(10px);
}

/* Sidebar Styling */
[data-testid="stSidebar"] {
    background-color: #081A2F !important;
    border-right: 1px solid #174567 !important;
}

[data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3 {
    color: #F1F7FF !important;
}

/* Cards & Containers */
.stock-card {
    background: #0B2038;
    border: 1px solid #174567;
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    margin-bottom: 1rem;
    transition: transform 0.2s ease, border-color 0.2s ease;
}
.stock-card:hover {
    border-color: #00D4FF;
    transform: translateY(-2px);
}

.card-title {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94A9C3;
    font-weight: 600;
    margin-bottom: 0.4rem;
}

.card-value {
    font-size: 1.85rem;
    font-weight: 700;
    color: #F1F7FF;
}

/* Accent Badges */
.badge {
    display: inline-block;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}
.badge-in-stock {
    background: rgba(0, 214, 163, 0.15);
    color: #00D6A3;
    border: 1px solid rgba(0, 214, 163, 0.4);
}
.badge-low-stock {
    background: rgba(255, 176, 32, 0.15);
    color: #FFB020;
    border: 1px solid rgba(255, 176, 32, 0.4);
}
.badge-out-stock {
    background: rgba(255, 77, 121, 0.15);
    color: #FF4D79;
    border: 1px solid rgba(255, 77, 121, 0.4);
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #168BFF 0%, #8B5CF6 100%) !important;
    color: #FFFFFF !important;
    font-weight: 600 !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0.5rem 1.25rem !important;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
    transition: all 0.2s ease !important;
}
.stButton > button:hover {
    box-shadow: 0 6px 16px rgba(0, 212, 255, 0.4) !important;
    transform: translateY(-1px);
}

/* Inputs & Selectboxes */
div[data-baseweb="input"] {
    background-color: #102A46 !important;
    border: 1px solid #174567 !important;
    border-radius: 8px !important;
    color: #F1F7FF !important;
}
div[data-baseweb="select"] > div {
    background-color: #102A46 !important;
    border: 1px solid #174567 !important;
    border-radius: 8px !important;
    color: #F1F7FF !important;
}

/* Tables */
[data-testid="stDataFrame"] {
    border: 1px solid #174567 !important;
    border-radius: 10px !important;
    background-color: #0B2038 !important;
}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ==============================================================================
# State Management (Loads JSON Data)
# ==============================================================================
if "products" not in st.session_state:
    st.session_state.products = storage.load_products()

if "transactions" not in st.session_state:
    st.session_state.transactions = storage.load_transactions()

# If products are completely empty on first launch, seed the demo records
if len(st.session_state.products) == 0:
    _, st.session_state.products = im.load_sample_products([])
    storage.save_products(st.session_state.products)

# ==============================================================================
# Sidebar Branding & Navigation
# ==============================================================================
with st.sidebar:
    st.markdown(
        """
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #174567;">
            <div style="background: linear-gradient(135deg, #00D4FF, #8B5CF6); width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);">
                📦
            </div>
            <div>
                <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; color: #F1F7FF;">StockFlow</h2>
                <p style="margin: 0; font-size: 0.75rem; color: #00D4FF; letter-spacing: 0.05em; text-transform: uppercase;">Inventory Management</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    nav_options = [
        "Dashboard",
        "Products",
        "Add Product",
        "Update Stock",
        "Record Sale",
        "Stock History",
        "Low-Stock Alerts",
        "Reports",
        "Settings",
        "Project Information",
    ]

    icons = ["📊", "📦", "➕", "📥", "🛒", "📜", "⚠️", "📑", "⚙️", "🎓"]
    nav_labels = [f"{icons[i]}  {nav_options[i]}" for i in range(len(nav_options))]

    selected_nav = st.radio("Navigation", nav_labels, label_visibility="collapsed")
    current_page = nav_options[nav_labels.index(selected_nav)]

    # Quick storage status in sidebar footer
    st.markdown("<div style='margin-top: 2rem;'></div>", unsafe_allow_html=True)
    st.markdown(
        f"""
        <div style="background: #102A46; border: 1px solid #174567; border-radius: 8px; padding: 0.75rem; font-size: 0.75rem; color: #94A9C3;">
            <div style="color: #00D4FF; font-weight: 600; margin-bottom: 4px;">STORAGE STATUS</div>
            <div>Active Products: <span style="color:#FFF; font-weight:700;">{len(st.session_state.products)}</span></div>
            <div>Transactions: <span style="color:#FFF; font-weight:700;">{len(st.session_state.transactions)}</span></div>
            <div>Mode: <span style="color:#00D6A3; font-weight:600;">JSON Persistent</span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )

# Calculate real-time metrics
metrics = im.calculate_inventory_metrics(st.session_state.products)
low_stock_list = im.get_low_stock_products(st.session_state.products)
out_of_stock_list = im.get_out_of_stock_products(st.session_state.products)
total_alerts = len(low_stock_list) + len(out_of_stock_list)

# ==============================================================================
# Header Bar (Search & Notification Indicator)
# ==============================================================================
header_col1, header_col2, header_col3 = st.columns([6, 3, 3])
with header_col1:
    global_search = st.text_input(
        "Global Search",
        placeholder="🔍 Search products, category or ID...",
        label_visibility="collapsed",
    )
with header_col2:
    alert_badge = f"<span class='badge badge-out-stock'>{total_alerts} Alerts</span>" if total_alerts > 0 else "<span class='badge badge-in-stock'>Healthy</span>"
    st.markdown(
        f"""
        <div style="display: flex; align-items: center; justify-content: flex-end; height: 100%; gap: 10px;">
            <span style="font-size: 0.85rem; color: #94A9C3;">Status:</span>
            {alert_badge}
        </div>
        """,
        unsafe_allow_html=True,
    )
with header_col3:
    today_str = datetime.date.today().strftime("%b %d, %Y")
    st.markdown(
        f"""
        <div style="display: flex; align-items: center; justify-content: flex-end; height: 100%; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #168BFF; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #FFF; font-weight: bold;">AD</div>
            <div style="font-size: 0.8rem; line-height: 1.2;">
                <div style="color: #F1F7FF; font-weight: 600;">Hello, Admin</div>
                <div style="color: #7186A3; font-size: 0.7rem;">{today_str}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<hr style='border: 0; border-top: 1px solid #174567; margin: 0.5rem 0 1.5rem 0;'>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 1: DASHBOARD
# ==============================================================================
if current_page == "Dashboard":
    st.title("Dashboard")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Overview of your inventory and stock health</p>", unsafe_allow_html=True)

    # 6 Summary Metric Cards
    c1, c2, c3, c4, c5, c6 = st.columns(6)

    with c1:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #00D4FF;">
                <div class="card-title">Total Products</div>
                <div class="card-value" style="color: #00D4FF;">{metrics['total_products']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c2:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #8B5CF6;">
                <div class="card-title">Stock Value</div>
                <div class="card-value" style="color: #8B5CF6;">₹{metrics['total_stock_value']:,.2f}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c3:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #FFB020;">
                <div class="card-title">Low Stock</div>
                <div class="card-value" style="color: #FFB020;">{metrics['low_stock_count']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c4:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #00D6A3;">
                <div class="card-title">In Stock Units</div>
                <div class="card-value" style="color: #00D6A3;">{metrics['total_units']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c5:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #FF4D79;">
                <div class="card-title">Out of Stock</div>
                <div class="card-value" style="color: #FF4D79;">{metrics['out_of_stock_count']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c6:
        st.markdown(
            f"""
            <div class="stock-card" style="border-top: 3px solid #168BFF;">
                <div class="card-title">Categories</div>
                <div class="card-value" style="color: #168BFF;">{metrics['total_categories']}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Charts Section
    col_chart1, col_chart2 = st.columns([7, 5])

    with col_chart1:
        st.markdown("<div class='stock-card'><h4 style='color: #00D4FF; margin-top: 0;'>📈 Stock Movement Overview</h4>", unsafe_allow_html=True)
        if len(st.session_state.transactions) > 0 and HAS_PLOTLY:
            df_tx = pd.DataFrame(st.session_state.transactions)
            fig_tx = px.bar(
                df_tx.head(15),
                x="product_name",
                y="quantity_changed",
                color="movement_type",
                color_discrete_map={"Stock In": "#00D6A3", "Sale": "#FF4D79", "Adjustment": "#00D4FF"},
                barmode="group",
                title="Recent Stock Transactions",
            )
            fig_tx.update_layout(
                paper_bgcolor="#0B2038",
                plot_bgcolor="#0B2038",
                font_color="#F1F7FF",
                margin=dict(l=20, r=20, t=40, b=20),
            )
            st.plotly_chart(fig_tx, use_container_width=True)
        elif len(st.session_state.transactions) > 0:
            st.write(pd.DataFrame(st.session_state.transactions).head(5))
        else:
            st.info("No transaction history recorded yet. Perform a Stock In or Sale to see trend graphs.")
        st.markdown("</div>", unsafe_allow_html=True)

    with col_chart2:
        st.markdown("<div class='stock-card'><h4 style='color: #8B5CF6; margin-top: 0;'>🍩 Product Distribution by Category</h4>", unsafe_allow_html=True)
        if len(st.session_state.products) > 0 and HAS_PLOTLY:
            cat_df = pd.DataFrame(metrics["category_valuation"].values())
            fig_donut = px.pie(
                cat_df,
                names="category",
                values="product_count",
                hole=0.6,
                color_discrete_sequence=["#00D4FF", "#8B5CF6", "#168BFF", "#00D6A3", "#FFB020"],
            )
            fig_donut.update_layout(
                paper_bgcolor="#0B2038",
                plot_bgcolor="#0B2038",
                font_color="#F1F7FF",
                margin=dict(l=20, r=20, t=30, b=20),
            )
            st.plotly_chart(fig_donut, use_container_width=True)
        elif len(st.session_state.products) > 0:
            st.write(pd.DataFrame(metrics["category_valuation"].values()))
        else:
            st.info("No products currently in inventory.")
        st.markdown("</div>", unsafe_allow_html=True)

    # Lower Section: Recent Products & Stock Alerts
    col_lower1, col_lower2 = st.columns([7, 5])

    with col_lower1:
        st.markdown("<div class='stock-card'><h4 style='color: #00D4FF; margin-top: 0;'>📦 Recent Inventory Items</h4>", unsafe_allow_html=True)
        if len(st.session_state.products) > 0:
            df_prods = pd.DataFrame(st.session_state.products)
            df_display = df_prods[["product_id", "product_name", "category", "unit_price", "stock_quantity", "reorder_level"]].head(6)
            df_display.columns = ["ID", "Name", "Category", "Price (₹)", "Stock", "Reorder"]
            st.dataframe(df_display, use_container_width=True, hide_index=True)
        else:
            st.info("No products registered yet.")
        st.markdown("</div>", unsafe_allow_html=True)

    with col_lower2:
        st.markdown("<div class='stock-card'><h4 style='color: #FFB020; margin-top: 0;'>⚠️ Critical Stock Alerts</h4>", unsafe_allow_html=True)
        if total_alerts > 0:
            for item in out_of_stock_list:
                st.markdown(
                    f"""
                    <div style="background: rgba(255, 77, 121, 0.1); border-left: 3px solid #FF4D79; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px;">
                        <span style="color: #FF4D79; font-weight: bold;">OUT OF STOCK:</span>
                        <b>{item['product_name']}</b> ({item['product_id']}) — 0 units remaining.
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            for item in low_stock_list:
                st.markdown(
                    f"""
                    <div style="background: rgba(255, 176, 32, 0.1); border-left: 3px solid #FFB020; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px;">
                        <span style="color: #FFB020; font-weight: bold;">LOW STOCK:</span>
                        <b>{item['product_name']}</b> ({item['product_id']}) — {item['stock_quantity']} units left (Reorder at {item['reorder_level']}).
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
        else:
            st.markdown(
                """
                <div style="background: rgba(0, 214, 163, 0.1); border-left: 3px solid #00D6A3; padding: 12px; border-radius: 6px;">
                    <span style="color: #00D6A3; font-weight: bold;">✓ All Inventory Healthy:</span> No products are currently below reorder thresholds.
                </div>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 2: PRODUCTS TABLE, SEARCH, FILTER, EDIT & DELETE
# ==============================================================================
elif current_page == "Products":
    st.title("Products Inventory")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Manage, search, filter, and inspect your full product catalog</p>", unsafe_allow_html=True)

    # Search & Filter Row
    f_col1, f_col2, f_col3 = st.columns([5, 3, 3])
    with f_col1:
        search_kw = st.text_input("Filter Products", placeholder="Search by name, ID, or category...", value=global_search)
    with f_col2:
        categories = ["All"] + metrics["categories_list"]
        cat_choice = st.selectbox("Category Filter", categories)
    with f_col3:
        status_choice = st.selectbox("Stock Status Filter", ["All", "In Stock", "Low Stock", "Out of Stock"])

    filtered_prods = im.search_and_filter_products(
        st.session_state.products,
        search_query=search_kw,
        category_filter=cat_choice,
        status_filter=status_choice,
    )

    st.markdown(f"<p style='color: #00D4FF; font-size: 0.85rem;'>Showing {len(filtered_prods)} of {len(st.session_state.products)} products</p>", unsafe_allow_html=True)

    if filtered_prods:
        # Build enriched display table
        table_rows = []
        for p in filtered_prods:
            qty = p.get("stock_quantity", 0)
            reorder = p.get("reorder_level", 0)
            price = p.get("unit_price", 0.0)
            val = im.calculate_product_value(price, qty)
            status = im.determine_stock_status(qty, reorder)
            table_rows.append({
                "Product ID": p.get("product_id"),
                "Product Name": p.get("product_name"),
                "Category": p.get("category"),
                "Unit Price (₹)": f"₹{price:.2f}",
                "Stock": qty,
                "Reorder Level": reorder,
                "Total Value (₹)": f"₹{val:.2f}",
                "Status": status,
            })
        st.dataframe(pd.DataFrame(table_rows), use_container_width=True, hide_index=True)

        # Edit / Delete Section
        st.markdown("<hr style='border: 0; border-top: 1px solid #174567; margin: 1.5rem 0;'>", unsafe_allow_html=True)
        st.subheader("🛠️ Product Actions")
        act_col1, act_col2 = st.columns(2)

        with act_col1:
            st.markdown("<div class='stock-card'><h5 style='color: #00D4FF;'>Edit Product Details</h5>", unsafe_allow_html=True)
            edit_pid = st.selectbox("Select Product to Edit", [p["product_id"] for p in st.session_state.products], key="edit_selector")
            selected_to_edit = next((p for p in st.session_state.products if p["product_id"] == edit_pid), None)

            if selected_to_edit:
                with st.form("edit_product_form"):
                    e_name = st.text_input("Product Name", value=selected_to_edit.get("product_name", ""))
                    e_cat = st.text_input("Category", value=selected_to_edit.get("category", ""))
                    e_price = st.number_input("Unit Price (₹)", min_value=0.01, value=float(selected_to_edit.get("unit_price", 10.0)), step=1.0)
                    e_reorder = st.number_input("Reorder Level", min_value=0, value=int(selected_to_edit.get("reorder_level", 10)), step=1)
                    edit_submitted = st.form_submit_button("Save Changes")

                    if edit_submitted:
                        try:
                            updated_item, new_list = im.update_product_details(
                                st.session_state.products,
                                edit_pid,
                                e_name,
                                e_cat,
                                e_price,
                                e_reorder,
                            )
                            st.session_state.products = new_list
                            storage.save_products(st.session_state.products)
                            st.success(f"✓ Product '{edit_pid}' updated successfully!")
                            st.rerun()
                        except im.InventoryValidationError as err:
                            st.error(f"Validation Error: {err}")
            st.markdown("</div>", unsafe_allow_html=True)

        with act_col2:
            st.markdown("<div class='stock-card'><h5 style='color: #FF4D79;'>Delete Product</h5>", unsafe_allow_html=True)
            del_pid = st.selectbox("Select Product to Remove", [p["product_id"] for p in st.session_state.products], key="del_selector")
            del_confirm = st.checkbox("I confirm that I wish to permanently delete this product.", key="del_confirm_box")
            if st.button("Delete Product", key="delete_button"):
                if not del_confirm:
                    st.warning("Please tick the confirmation checkbox before deleting.")
                else:
                    try:
                        deleted_p, new_list = im.delete_product(st.session_state.products, del_pid)
                        st.session_state.products = new_list
                        storage.save_products(st.session_state.products)
                        st.success(f"✓ Product '{del_pid}' ({deleted_p.get('product_name')}) removed.")
                        st.rerun()
                    except im.InventoryValidationError as err:
                        st.error(str(err))
            st.markdown("</div>", unsafe_allow_html=True)
    else:
        st.info("No products match the selected criteria.")

# ==============================================================================
# PAGE 3: ADD PRODUCT
# ==============================================================================
elif current_page == "Add Product":
    st.title("Add New Product")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Register a new item into the inventory with full validation checks</p>", unsafe_allow_html=True)

    with st.form("add_product_form", clear_on_submit=True):
        fcol1, fcol2 = st.columns(2)
        with fcol1:
            p_id = st.text_input("Product ID *", placeholder="e.g., P006, SKU-101", help="Unique alphanumeric code (letters, numbers, hyphens, underscores)")
            p_name = st.text_input("Product Name *", placeholder="e.g., Gel Pen Blue, A4 Paper")
            p_cat = st.text_input("Category *", placeholder="e.g., Stationery, Electronics, Hardware")

        with fcol2:
            p_price = st.number_input("Unit Price in ₹ *", min_value=0.0, value=50.0, step=1.0)
            p_qty = st.number_input("Initial Stock Quantity *", min_value=0, value=25, step=1)
            p_reorder = st.number_input("Reorder Level Threshold *", min_value=0, value=10, step=1)

        submitted = st.form_submit_button("Register Product to StockFlow")
        if submitted:
            try:
                new_item, new_list = im.add_product(
                    st.session_state.products,
                    p_id,
                    p_name,
                    p_cat,
                    p_price,
                    p_qty,
                    p_reorder,
                )
                st.session_state.products = new_list
                storage.save_products(st.session_state.products)
                st.success(f"✓ Successfully registered product '{new_item['product_name']}' with ID '{new_item['product_id']}'!")
                st.rerun()
            except im.InventoryValidationError as err:
                st.error(f"Validation Failure: {err}")

# ==============================================================================
# PAGE 4: UPDATE STOCK (STOCK IN)
# ==============================================================================
elif current_page == "Update Stock":
    st.title("Update Stock (Stock In)")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Record incoming stock shipments and replenishment</p>", unsafe_allow_html=True)

    if not st.session_state.products:
        st.warning("No products available to update. Please add a product first.")
    else:
        prod_options = {f"{p['product_id']} — {p['product_name']}": p["product_id"] for p in st.session_state.products}
        chosen_label = st.selectbox("Select Product to Replenish", list(prod_options.keys()))
        selected_pid = prod_options[chosen_label]
        target_prod = next(p for p in st.session_state.products if p["product_id"] == selected_pid)

        st.markdown(
            f"""
            <div class="stock-card" style="margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #00D4FF;">{target_prod['product_name']} ({target_prod['product_id']})</h4>
                        <span style="color: #94A9C3; font-size: 0.85rem;">Category: {target_prod['category']} | Price: ₹{target_prod['unit_price']:.2f}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.75rem; color: #94A9C3;">CURRENT ON-HAND</span>
                        <div style="font-size: 1.75rem; font-weight: 700; color: #00D6A3;">{target_prod['stock_quantity']} units</div>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("stock_in_form"):
            col_in1, col_in2 = st.columns(2)
            with col_in1:
                qty_in = st.number_input("Quantity Received (Positive Integer) *", min_value=1, value=10, step=1)
            with col_in2:
                notes_in = st.text_input("Shipment Notes / Supplier Reference", placeholder="e.g. Batch #402, Supplier Delivery")

            submit_stock_in = st.form_submit_button("Confirm Stock In")
            if submit_stock_in:
                try:
                    updated_prod, tx, new_prods, new_txs = im.record_stock_addition(
                        st.session_state.products,
                        st.session_state.transactions,
                        selected_pid,
                        qty_in,
                        notes_in,
                    )
                    st.session_state.products = new_prods
                    st.session_state.transactions = new_txs
                    storage.save_products(st.session_state.products)
                    storage.save_transactions(st.session_state.transactions)
                    st.success(f"✓ Stock updated! Added {qty_in} units to '{target_prod['product_name']}'. New Balance: {updated_prod['stock_quantity']} units.")
                    st.rerun()
                except im.InventoryValidationError as err:
                    st.error(str(err))

# ==============================================================================
# PAGE 5: RECORD SALE
# ==============================================================================
elif current_page == "Record Sale":
    st.title("Record Product Sale")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Deduct customer sales from inventory with automatic boundary checks</p>", unsafe_allow_html=True)

    if not st.session_state.products:
        st.warning("No products available.")
    else:
        prod_options = {f"{p['product_id']} — {p['product_name']} ({p['stock_quantity']} in stock)": p["product_id"] for p in st.session_state.products}
        chosen_label = st.selectbox("Select Product to Sell", list(prod_options.keys()))
        selected_pid = prod_options[chosen_label]
        target_prod = next(p for p in st.session_state.products if p["product_id"] == selected_pid)

        st.markdown(
            f"""
            <div class="stock-card" style="margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #8B5CF6;">{target_prod['product_name']} ({target_prod['product_id']})</h4>
                        <span style="color: #94A9C3; font-size: 0.85rem;">Price per unit: ₹{target_prod['unit_price']:.2f}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.75rem; color: #94A9C3;">AVAILABLE UNITS</span>
                        <div style="font-size: 1.75rem; font-weight: 700; color: {'#FF4D79' if target_prod['stock_quantity'] == 0 else '#00D6A3'};">
                            {target_prod['stock_quantity']} units
                        </div>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.form("record_sale_form"):
            col_s1, col_s2 = st.columns(2)
            with col_s1:
                qty_sold = st.number_input("Units Sold (Positive Integer) *", min_value=1, max_value=max(1, target_prod["stock_quantity"]), value=1, step=1)
            with col_s2:
                notes_sold = st.text_input("Sale Remarks / Invoice ID", placeholder="e.g. Counter sale, Cash bill #89")

            submit_sale = st.form_submit_button("Finalize Sale")
            if submit_sale:
                try:
                    updated_prod, tx, new_prods, new_txs = im.record_sale(
                        st.session_state.products,
                        st.session_state.transactions,
                        selected_pid,
                        qty_sold,
                        notes_sold,
                    )
                    st.session_state.products = new_prods
                    st.session_state.transactions = new_txs
                    storage.save_products(st.session_state.products)
                    storage.save_transactions(st.session_state.transactions)
                    st.success(f"✓ Sale recorded! Sold {qty_sold} units of '{target_prod['product_name']}'. Remaining balance: {updated_prod['stock_quantity']} units.")
                    st.rerun()
                except im.InventoryValidationError as err:
                    st.error(str(err))

# ==============================================================================
# PAGE 6: STOCK HISTORY & TRANSACTIONS
# ==============================================================================
elif current_page == "Stock History":
    st.title("Stock Movement Audit History")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Traceable log of all stock additions, deductions, and manual adjustments</p>", unsafe_allow_html=True)

    if not st.session_state.transactions:
        st.info("No transaction logs yet. Stock additions and sales will be recorded here.")
    else:
        df_tx = pd.DataFrame(st.session_state.transactions)

        # Filters
        t_col1, t_col2 = st.columns([6, 6])
        with t_col1:
            tx_types = ["All"] + sorted(list(set(df_tx["movement_type"].tolist())))
            selected_type = st.selectbox("Movement Type", tx_types)
        with t_col2:
            tx_search = st.text_input("Search Transactions", placeholder="Filter by Product Name, ID, or Transaction ID...")

        filtered_df = df_tx
        if selected_type != "All":
            filtered_df = filtered_df[filtered_df["movement_type"] == selected_type]
        if tx_search:
            kw = tx_search.lower()
            filtered_df = filtered_df[
                filtered_df["product_name"].str.lower().str.contains(kw)
                | filtered_df["product_id"].str.lower().str.contains(kw)
                | filtered_df["transaction_id"].str.lower().str.contains(kw)
            ]

        st.dataframe(filtered_df, use_container_width=True, hide_index=True)

        # CSV Export
        csv_tx = reports.generate_stock_movement_report_csv(st.session_state.transactions)
        st.download_button(
            label="📥 Download Complete Stock Movement CSV",
            data=csv_tx,
            file_name=f"StockFlow_Transactions_{datetime.date.today()}.csv",
            mime="text/csv",
        )

# ==============================================================================
# PAGE 7: LOW-STOCK ALERTS
# ==============================================================================
elif current_page == "Low-Stock Alerts":
    st.title("Low-Stock & Reorder Alerts")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Identify items needing immediate replenishment to prevent stockouts</p>", unsafe_allow_html=True)

    if total_alerts == 0:
        st.markdown(
            """
            <div class="stock-card" style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 3rem;">🎉</div>
                <h3 style="color: #00D6A3;">Inventory is Completely Healthy</h3>
                <p style="color: #94A9C3;">All products have quantities safely above their reorder thresholds.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        if out_of_stock_list:
            st.markdown("<h4 style='color: #FF4D79;'>🚨 Out of Stock (0 Units Available)</h4>", unsafe_allow_html=True)
            for item in out_of_stock_list:
                with st.expander(f"❌ {item['product_name']} ({item['product_id']}) — 0 Units Left"):
                    st.write(f"Category: {item['category']}")
                    st.write(f"Reorder Level: {item['reorder_level']}")
                    st.write(f"Suggested Order Quantity: {item.get('suggested_reorder', 10)} units")

        if low_stock_list:
            st.markdown("<h4 style='color: #FFB020;'>⚠️ Low Stock Warning (Below or At Reorder Level)</h4>", unsafe_allow_html=True)
            for item in low_stock_list:
                with st.expander(f"⚠️ {item['product_name']} ({item['product_id']}) — {item['stock_quantity']} Units Left"):
                    st.write(f"Category: {item['category']}")
                    st.write(f"Current Stock: {item['stock_quantity']}")
                    st.write(f"Reorder Level: {item['reorder_level']}")
                    st.write(f"Suggested Order Quantity: {item.get('suggested_reorder', 10)} units")

# ==============================================================================
# PAGE 8: REPORTS & EXPORTS
# ==============================================================================
elif current_page == "Reports":
    st.title("Inventory Reports & Data Exports")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Generate, inspect, and download official CSV audit sheets</p>", unsafe_allow_html=True)

    r_col1, r_col2 = st.columns(2)

    with r_col1:
        st.markdown("<div class='stock-card'><h4 style='color: #00D4FF;'>1. Complete Inventory Report</h4>", unsafe_allow_html=True)
        st.write("Full catalog audit with prices, quantities, valuations, and stock statuses.")
        csv_inv = reports.generate_inventory_report_csv(st.session_state.products)
        st.download_button(
            "📥 Download Inventory CSV",
            data=csv_inv,
            file_name=f"StockFlow_Inventory_{datetime.date.today()}.csv",
            mime="text/csv",
        )
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("<div class='stock-card'><h4 style='color: #FFB020;'>2. Low-Stock & Reorder Report</h4>", unsafe_allow_html=True)
        st.write("Products requiring purchasing orders with suggested replenishment amounts.")
        csv_low = reports.generate_low_stock_report_csv(st.session_state.products)
        st.download_button(
            "📥 Download Low-Stock CSV",
            data=csv_low,
            file_name=f"StockFlow_LowStock_{datetime.date.today()}.csv",
            mime="text/csv",
        )
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("<div class='stock-card'><h4 style='color: #FF4D79;'>3. Out-of-Stock Report</h4>", unsafe_allow_html=True)
        st.write("Critical stockouts requiring immediate manager attention.")
        csv_out = reports.generate_out_of_stock_report_csv(st.session_state.products)
        st.download_button(
            "📥 Download Out-of-Stock CSV",
            data=csv_out,
            file_name=f"StockFlow_OutOfStock_{datetime.date.today()}.csv",
            mime="text/csv",
        )
        st.markdown("</div>", unsafe_allow_html=True)

    with r_col2:
        st.markdown("<div class='stock-card'><h4 style='color: #8B5CF6;'>4. Stock Movement Audit Report</h4>", unsafe_allow_html=True)
        st.write("Every stock in, customer sale, and manual quantity adjustment with timestamps.")
        csv_tx = reports.generate_stock_movement_report_csv(st.session_state.transactions)
        st.download_button(
            "📥 Download Stock Movement CSV",
            data=csv_tx,
            file_name=f"StockFlow_Movements_{datetime.date.today()}.csv",
            mime="text/csv",
        )
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("<div class='stock-card'><h4 style='color: #00D6A3;'>5. Category Valuation Report</h4>", unsafe_allow_html=True)
        st.write("Category breakdowns with unit counts, total rupee valuations, and portfolio share.")
        csv_val = reports.generate_valuation_report_csv(st.session_state.products)
        st.download_button(
            "📥 Download Category Valuation CSV",
            data=csv_val,
            file_name=f"StockFlow_Valuation_{datetime.date.today()}.csv",
            mime="text/csv",
        )
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 9: SETTINGS & SAMPLE DATA
# ==============================================================================
elif current_page == "Settings":
    st.title("System Settings & Storage")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Manage persistent JSON storage and demonstration datasets</p>", unsafe_allow_html=True)

    s1, s2 = st.columns(2)

    with s1:
        st.markdown("<div class='stock-card'><h4 style='color: #00D4FF;'>Data Management</h4>", unsafe_allow_html=True)
        st.write(f"Storage Directory: `{storage.DATA_DIR}`")
        st.write(f"Products JSON: `{storage.INVENTORY_FILE}`")
        st.write(f"Transactions JSON: `{storage.TRANSACTIONS_FILE}`")

        if st.button("🔄 Reload from Disk"):
            st.session_state.products = storage.load_products()
            st.session_state.transactions = storage.load_transactions()
            st.success("Reloaded latest JSON files from disk.")
            st.rerun()

        if st.button("📥 Load Academic Sample Data (P001 - P005)"):
            added, new_list = im.load_sample_products(st.session_state.products)
            st.session_state.products = new_list
            storage.save_products(st.session_state.products)
            if added > 0:
                st.success(f"Added {added} demonstration products without overwriting user data.")
            else:
                st.info("Demonstration products already present in inventory.")
            st.rerun()

        if st.button("🧹 Clear Demo Products (Protects User Data)"):
            removed, new_list = im.clear_sample_products(st.session_state.products)
            st.session_state.products = new_list
            storage.save_products(st.session_state.products)
            st.success(f"Removed {removed} demo products. Real user products preserved.")
            st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    with s2:
        st.markdown("<div class='stock-card'><h4 style='color: #8B5CF6;'>Backup & Export</h4>", unsafe_allow_html=True)
        st.write("Generate a timestamped snapshot of inventory and transaction records.")
        if st.button("📦 Create Timestamped Backup"):
            backup_dir = os.path.join(storage.DATA_DIR, "backups")
            res = storage.export_backup_json(backup_dir)
            st.success(f"Backup created at `{res['timestamp']}` in `{backup_dir}`!")
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 10: PROJECT INFORMATION (CSE1012)
# ==============================================================================
elif current_page == "Project Information":
    st.title("Project Information & Academic Specification")
    st.markdown("<p style='color: #94A9C3; margin-top: -15px;'>Documentation for CSE1012: Problem Solving using Python Viva & Examination</p>", unsafe_allow_html=True)

    st.markdown(
        """
        <div class="stock-card">
            <h3 style="color: #00D4FF; margin-top:0;">Project Overview</h3>
            <p><b>Project Title:</b> StockFlow — Inventory and Stock Management System</p>
            <p><b>Course:</b> CSE1012 – Problem Solving using Python</p>
            <p><b>Objective:</b> To develop a Python application that manages products in a small shop or storeroom, tracks stock additions and sales, calculates inventory value, identifies products requiring reorder, and generates inventory reports.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        """
        <div class="stock-card">
            <h3 style="color: #8B5CF6; margin-top:0;">Python Concepts Demonstrated (Syllabus Mapping)</h3>
            <ul>
                <li><b>Dictionaries:</b> Product records (ID, name, price, stock, reorder level) and transaction records.</li>
                <li><b>Sets:</b> O(1) membership checking to ensure unique Product IDs and category deduplication.</li>
                <li><b>Lists:</b> Dynamic product catalog and ordered transaction audit logs.</li>
                <li><b>Functions:</b> Modular architecture across <code>inventory_manager.py</code>, <code>storage.py</code>, and <code>reports.py</code>.</li>
                <li><b>Loops:</b> Iteration over products for search matching, valuation sums, and CSV serialization.</li>
                <li><b>Conditionals:</b> Status rules (Out of Stock, Low Stock, In Stock) and sales bounds checking.</li>
                <li><b>Regular Expressions:</b> <code>^[A-Za-z0-9_-]+$</code> for product ID format validation.</li>
                <li><b>File Handling:</b> Atomic JSON persistence and standard CSV export formatting.</li>
                <li><b>Exception Handling:</b> <code>InventoryValidationError</code> and try/except file recovery blocks.</li>
            </ul>
        </div>
        """,
        unsafe_allow_html=True,
    )
