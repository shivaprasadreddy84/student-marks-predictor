import pickle
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from database import get_db_connection


MODEL_FILE = os.path.join(
    os.path.dirname(__file__),
    "marks_prediction_model.pkl"
)


def load_training_data():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            study_time_level,
            failures,
            absences,
            g1_marks,
            g2_marks,
            g3_marks
        FROM ml_training_data
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows


def train_model():

    rows = load_training_data()

    X = []
    y = []

    for row in rows:

        study_time = row[0]
        failures = row[1]
        absences = row[2]
        g1 = float(row[3])
        g2 = float(row[4])
        g3 = float(row[5])

        X.append([
            study_time,
            failures,
            absences,
            g1,
            g2
        ])

        y.append(g3)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    model = LinearRegression()

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    with open(MODEL_FILE, "wb") as file:
        pickle.dump(model, file)

    print("ML model trained successfully!")
    print("Training records:", len(rows))
    print("MAE:", round(mae, 2))
    print("RMSE:", round(rmse, 2))
    print("R2 Score:", round(r2, 2))
    print("Model saved successfully!")


if __name__ == "__main__":
    train_model()