TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`localhost` TRIGGER update_total_labour_hours\nAFTER INSERT ON quotings.items\nFOR EACH ROW\nBEGIN\n    UPDATE quotings.Bills \n    SET total_labour_hours = (\n        SELECT SUM(labour_factor_hrs * qty) \n        FROM quotings.items \n        WHERE reference = NEW.reference\n    )\n    WHERE reference = NEW.reference;\nEND'
sql_modes=1098907648
definers='root@localhost'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_general_ci'
db_cl_names='utf8mb4_general_ci'
created=1742796646305406
