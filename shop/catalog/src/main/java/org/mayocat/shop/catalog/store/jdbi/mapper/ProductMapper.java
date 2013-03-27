package org.mayocat.shop.catalog.store.jdbi.mapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.mayocat.shop.catalog.model.Product;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import com.google.common.base.Strings;

public class ProductMapper implements ResultSetMapper<Product>
{
    @Override
    public Product map(int index, ResultSet resultSet, StatementContext statementContext) throws SQLException
    {
        Product product = new Product(resultSet.getLong("id"));
        product.setSlug(resultSet.getString("slug"));
        product.setTitle(resultSet.getString("title"));
        product.setDescription(resultSet.getString("description"));
        product.setOnShelf(resultSet.getBoolean("on_shelf"));
        product.setPrice(resultSet.getBigDecimal("price"));
        long featuredImageId = resultSet.getLong("featured_image_id");
        if (featuredImageId > 0) {
            product.setFeaturedImageId(featuredImageId);
        }

        String model = resultSet.getString("model");
        if (!Strings.isNullOrEmpty(model)) {
            product.setModel(model);
        }
        return product;

    }
}
