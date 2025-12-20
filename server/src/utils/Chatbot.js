const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const modelProduct = require('../models/products.model');

async function askQuestion(question) {
    try {
        const products = await modelProduct.find({});
        const productData = products
            .map(
                (product) => `
        Tên: ${product.name}
        Giá: ${product.price.toLocaleString('vi-VN')}đ ${
                    product.priceDiscount ? `(Giảm giá: ${product.priceDiscount.toLocaleString('vi-VN')}đ)` : ''
                }
        Link chi tiết: ${process.env.CLIENT_URL}/product/${product._id}
        Hình ảnh: ${product.images?.[0] || ''}
        Thông số chi tiết:
        ${Object.entries(product.attributes || {})
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n        ')}
        Số lượng còn lại: ${product.stock}
      `,
            )
            .join('\n----------------------------------------\n');

        const prompt = `
        Bạn là tư vấn viên bán điện thoại tại cửa hàng MacOne. Trả lời NGẮN GỌN, thân thiện.

        Sản phẩm hiện có:
        ${productData}

        Khách hỏi: "${question}"

        QUY TẮC TRẢ LỜI:
        - Tối đa 3-4 câu cho mỗi ý
        - Chỉ gợi ý 1-2 sản phẩm phù hợp nhất
        - Nêu giá và 1-2 điểm nổi bật
        - Dùng emoji để sinh động
        - Nếu khách chào hỏi, chỉ cần chào lại thân thiện
        - Trả lời tiếng Việt, tự nhiên như đang chat
        - Khi nhắc đến sản phẩm nào, BẮT BUỘC phải kèm theo Link chi tiết VÀ Link hình ảnh (nếu có) của sản phẩm đó.
        - Các đường dẫn (URL) phải được tách biệt bằng khoảng trắng để dễ hiển thị.
        `;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        return answer;
    } catch (error) {
        console.log(error);
        return 'Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý câu hỏi của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với nhân viên tư vấn.';
    }
}

module.exports = { askQuestion };
